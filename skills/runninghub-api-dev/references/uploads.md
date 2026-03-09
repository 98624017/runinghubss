# 文件上传与资源回填

## 推荐上传接口

优先使用新版接口：

- 方法：`POST`
- 路径：`/openapi/v2/media/upload/binary`

## 请求方式

Header：

```http
Host: www.runninghub.cn
Authorization: Bearer <RUNNINGHUB_API_KEY>
```

Body：

- `multipart/form-data`
- 字段名：`file`

## 已验证上传结果

2026-03-08 实测上传 1×1 PNG 成功，得到：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "type": "image",
    "download_url": "https://...",
    "fileName": "openapi/c01aef53014548b229559cc463950d343da4469558a2f9c66b32669a7afeeebf.png",
    "size": "68"
  }
}
```

## 回填规则

提交工作流时，通常要把上传返回的 `fileName` 回填到 `nodeInfoList.fieldValue`。

例如：

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

## 注意事项

1. 回填 `fileName`，不要回填 `download_url`
2. 上传成功后再创建任务，避免任务侧报资源不存在
3. 不同节点的 `fieldName` 不同，图片常见是 `image`，但要以工作流定义为准
4. 大文件、压缩包要关注大小限制与上传失败重试
