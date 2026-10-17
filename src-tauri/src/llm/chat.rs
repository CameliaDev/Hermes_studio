use futures_util::StreamExt;
use tauri::ipc::Channel;

/// 调用 Deepseek API 进行聊天
#[tauri::command]
pub async fn chat(prompt: &str, on_event: Channel<String>) -> Result<(), String> {
    let env_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../.env");
    match dotenvy::from_path(env_path) {
        Ok(_) => {}
        Err(dotenvy::Error::Io(error)) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(format!("加载 .env 文件失败：{error}")),
    }

    let base_url = std::env::var("BASE_DEEPSEEK_URL")
        .map_err(|_| "缺少环境变量 BASE_DEEPSEEK_URL".to_string())?;
    let api_key =
        std::env::var("BASE_API_KEY").map_err(|_| "缺少环境变量 BASE_API_KEY".to_string())?;

    let base_url = base_url.trim().trim_end_matches('/');
    if base_url.is_empty() {
        return Err("环境变量 BASE_DEEPSEEK_URL 不能为空".to_string());
    }
    if api_key.trim().is_empty() {
        return Err("环境变量 BASE_API_KEY 不能为空".to_string());
    }

    let url = if base_url.ends_with("/chat/completions") {
        base_url.to_string()
    } else {
        format!("{base_url}/chat/completions")
    };

    // 发送请求
    let response = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|error| format!("创建 HTTP 客户端失败：{error}"))?
        .post(url)
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": "deepseek-flash",
            "stream": true,
            "messages": [
                { "role": "user", "content": prompt }
            ]
        }))
        .send()
        .await
        .map_err(|error| format!("请求 DeepSeek 失败：{error}"))?
        .error_for_status()
        .map_err(|error| format!("DeepSeek 返回错误状态：{error}"))?;

    // // 解析响应 JSON
    // let body: serde_json::Value = response
    //     .json()
    //     .await
    //     .map_err(|error| format!("解析 DeepSeek 响应失败：{error}"))?;

    // body["choices"][0]["message"]["content"]
    //     .as_str()
    //     .map(str::to_owned)
    //     .ok_or_else(|| "响应中没有找到模型回答".to_string())

    let mut stream = response.bytes_stream();
    let mut buffer = Vec::new();
    let mut data_lines = Vec::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| format!("读取流式响应失败：{error}"))?;
        buffer.extend_from_slice(&chunk);

        while let Some(newline_index) = buffer.iter().position(|byte| *byte == b'\n') {
            let mut line: Vec<u8> = buffer.drain(..=newline_index).collect();
            line.pop();

            if process_sse_line(&line, &mut data_lines, &on_event)? {
                return Ok(());
            }
        }
    }

    if !buffer.is_empty() && process_sse_line(&buffer, &mut data_lines, &on_event)? {
        return Ok(());
    }

    process_sse_line(&[], &mut data_lines, &on_event)?;
    Ok(())
}

fn process_sse_line(
    line: &[u8],
    data_lines: &mut Vec<String>,
    on_event: &Channel<String>,
) -> Result<bool, String> {
    let line = line.strip_suffix(b"\r").unwrap_or(line);

    if line.is_empty() {
        if data_lines.is_empty() {
            return Ok(false);
        }

        let data = data_lines.join("\n");
        data_lines.clear();

        if data == "[DONE]" {
            return Ok(true);
        }

        let event: serde_json::Value = serde_json::from_str(&data)
            .map_err(|error| format!("解析 DeepSeek 流式事件失败：{error}"))?;

        if let Some(error) = event.get("error") {
            let message = error
                .get("message")
                .and_then(serde_json::Value::as_str)
                .unwrap_or("DeepSeek 返回流式错误");
            return Err(message.to_string());
        }

        if let Some(content) = event
            .pointer("/choices/0/delta/content")
            .and_then(serde_json::Value::as_str)
        {
            on_event
                .send(content.to_string())
                .map_err(|error| format!("发送文本片段到前端失败：{error}"))?;
        }

        return Ok(false);
    }

    if let Some(data) = line.strip_prefix(b"data:") {
        let data = data.strip_prefix(b" ").unwrap_or(data);
        let data = String::from_utf8(data.to_vec())
            .map_err(|error| format!("流式响应不是有效 UTF-8：{error}"))?;
        data_lines.push(data);
    }

    Ok(false)
}
