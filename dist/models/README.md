# ONNX 模型目录

运行 `training/train_all.py` 后，会在此目录下生成以下文件：

- `logistic.onnx`
- `lenet5.onnx`
- `resnet18.onnx`

前端 `Sandbox` 组件会默认从 `/models/` 路径加载这些模型进行浏览器端推理。
