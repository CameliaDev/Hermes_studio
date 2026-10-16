/// 调用 Deepseek API 进行聊天
#[tauri::command]
pub async fn chat(prompt: &str) -> Result<String, String> {
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
            "messages": [
                { "role": "user", "content": prompt }
            ]
        }))
        .send()
        .await
        .map_err(|error| format!("请求 DeepSeek 失败：{error}"))?
        .error_for_status()
        .map_err(|error| format!("DeepSeek 返回错误状态：{error}"))?;

    // 解析响应 JSON
    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|error| format!("解析 DeepSeek 响应失败：{error}"))?;

    body["choices"][0]["message"]["content"]
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| "响应中没有找到模型回答".to_string())
}
