# 文件上传与回填

## 推荐接口

- [官网明确] `POST /openapi/v2/media/upload/binary`

## 为什么上传是单独一层

- [交叉整理] 图生图、音频、视频、压缩包等输入场景经常先上传，再发任务
- [交叉整理] 上传成功不代表任务一定成功，但上传失败时后续任务一定跑不通

## 已验证行为

- [真实验证] 上传一个 1×1 PNG 成功
- [真实验证] 返回结构中包含：
  - `code`
  - `msg`
  - `data.type`
  - `data.download_url`
  - `data.fileName`
  - `data.size`

## 关键结论

- [交叉整理] 提交任务时通常要回填 `fileName`
- [推断建议] 不要把 `download_url` 当作任务主输入值，优先用 `fileName`

## 实测返回摘要

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "type": "image",
    "fileName": "openapi/xxxxxxxx.png",
    "size": "68",
    "download_url": "https://..."
  }
}
```

## 常见回填示例

### 图片

```json
{
  "nodeId": "14",
  "fieldName": "image",
  "fieldValue": "api/9d77b8530f8b3591edc5c4e8f3f55b2cf0960bb2ca35c04e32c1677687866576.png"
}
```

### 音频

```json
{
  "nodeId": "2",
  "fieldName": "audio",
  "fieldValue": "api/7a2f4c8d1e5b9g3h6j0k2l7m4n8p1q3r5s9t0u2v4w6x8y0z1.mp3"
}
```

### 视频

```json
{
  "nodeId": "7",
  "fieldName": "video",
  "fieldValue": "api/14c585a56d8f7c3b9c1ad3c4f8edc93a9fd9f79e21b4d10afd811322bf65f3c2.mp4"
}
```

## 最小联调建议

1. [交叉整理] 先用极小文件验证上传
2. [交叉整理] 确认拿到了 `fileName`
3. [交叉整理] 再把这个值回填进任务请求

## 常见问题

- [官网明确] `808 APIKEY_UPLOAD_FAILED`
- [官网明确] `809 APIKEY_FILE_SIZE_EXCEEDED`
- [推断建议] 如果你上传成功但任务仍报资源问题，优先检查回填的是不是 `fileName`
