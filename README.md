# MNIST 多模型对比与浏览器端推理系统

一个基于 **PyTorch + ONNX + React + Vite + ONNX Runtime Web** 的端到端项目，用于训练、导出并可视化 3 种 MNIST 手写数字识别模型：**Logistic Regression、LeNet-5、ResNet-18**。系统同时提供浏览器内手写沙箱，可在前端本地完成无服务器推理。

## 项目概述

本项目围绕 MNIST 手写数字识别任务，构建了一个完整工作流：

- 使用 **PyTorch** 训练三种不同复杂度的模型。
- 使用 **ONNX** 导出模型，统一输入输出接口。
- 使用 **Matplotlib** 生成训练损失与验证准确率对比图。
- 使用 **React + Vite** 搭建交互式仪表盘。
- 使用 **ONNX Runtime Web** 在浏览器本地加载 ONNX 模型进行推理，无需后端推理服务。

## 系统架构与工作流

整体数据流如下：

1. **Python 训练阶段**
   - `training/train_all.py` 下载 MNIST 数据集。
   - 依次训练 Logistic Regression、LeNet-5、Custom ResNet-18。
   - 在每个 epoch 记录训练损失与验证准确率。

2. **模型导出阶段**
   - 训练完成后，将 3 个 PyTorch 模型导出为 ONNX：
     - `public/models/logistic.onnx`
     - `public/models/lenet5.onnx`
     - `public/models/resnet18.onnx`
   - 同时生成两组静态图：
     - `src/assets/loss_curve.png`
     - `src/assets/acc_curve.png`
     - `public/charts/loss_curve.png`
     - `public/charts/acc_curve.png`

3. **前端推理阶段**
   - React 前端从 `public/models/` 加载 ONNX 模型。
   - 用户在 Canvas 上书写数字。
   - 前端将图像缩放到 28×28，灰度化并做颜色反转，以匹配 MNIST 的白字黑底分布。
   - 使用 **ONNX Runtime Web** 在浏览器中直接推理。
   - 页面展示预测结果、0~9 概率分布，以及模型训练曲线和结构对比信息。

## 当前目录说明

由于当前仓库是一个现成的 Vite 前端工作区，因此前端文件位于仓库根目录下，而不是嵌套在 `mnist-app/` 中。核心结构如下：

```text
.
├── README.md
├── training/
│   ├── train_all.py
│   └── requirements.txt
├── public/
│   ├── charts/
│   │   ├── loss_curve.png
│   │   └── acc_curve.png
│   └── models/
│       └── README.md
└── src/
    ├── assets/
    │   ├── loss_curve.png
    │   └── acc_curve.png
    ├── components/
    │   ├── DatasetIntro.tsx
    │   ├── Sandbox.tsx
    │   └── ModelCompare.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── main.tsx
    └── vite-env.d.ts
```

## 本地开发与部署指南

### 一、Python 端：训练与导出模型

#### 1. 准备 Python 环境

建议使用 Python 3.10+，并创建虚拟环境：

```bash
cd training
python -m venv .venv
```

- macOS / Linux

```bash
source .venv/bin/activate
```

- Windows PowerShell

```powershell
.venv\Scripts\Activate.ps1
```

#### 2. 安装训练依赖

```bash
pip install -r requirements.txt
```

#### 3. 运行训练脚本

在项目根目录执行：

```bash
python training/train_all.py
```

脚本将自动完成：

- 下载 MNIST 数据集
- 训练 3 个模型
- 统计每轮训练损失和验证准确率
- 导出 ONNX 模型到 `public/models/`
- 生成训练曲线到 `src/assets/` 与 `public/charts/`

#### 4. 可选参数示例

```bash
python training/train_all.py --epochs 5 --batch-size 128 --learning-rate 0.001
```

### 二、前端 React 端：本地运行与构建

#### 1. 准备 Node.js 环境

推荐使用：

- Node.js 18+
- npm 9+

#### 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

#### 3. 启动本地开发环境

```bash
npm run dev
```

启动后在浏览器中即可体验：

- 数据集介绍
- 三模型结构说明
- 训练曲线对比
- Canvas 手写输入
- 浏览器端本地推理

#### 4. 生产构建

```bash
npm run build
```

构建完成后，静态资源会输出到 `dist/`，可部署到任意静态托管平台。

## 模型对比汇总

| 模型 | 结构特点 | 参数量级 | MNIST 测试集估算准确率 | 浏览器端预测延迟 | 说明 |
|---|---|---:|---:|---|---|
| Logistic Regression | 单层线性分类器，输入展平后直接分类 | 约 7.8K | 91% ~ 93% | 极快 | 适合作为基线模型 |
| LeNet-5 | 经典卷积网络，擅长局部模式提取 | 约 44K | 98.5% ~ 99.2% | 快速 | 精度与速度较均衡 |
| ResNet-18 | 残差网络，层次更深、表达力更强 | 约 11.2M | 99.1% ~ 99.4% | 中等 | 精度最佳，但模型更重 |

> 说明：浏览器端延迟与设备性能、浏览器类型、是否命中缓存以及 ONNX Runtime Web 初始化状态有关，上表为定性比较。

## 前端功能说明

### 1. DatasetIntro

- 展示 MNIST 基本统计信息
- 说明数据格式与任务背景
- 使用可视化数字栅格模拟示例样本
- 展示类别分布均衡性

### 2. Sandbox

- 提供 280×280 手写 Canvas
- 支持鼠标与触屏绘制
- 支持切换 3 个 ONNX 模型
- 自动完成：
  - 图像缩放至 28×28
  - RGB 转灰度
  - 颜色反转（匹配 MNIST 白字黑底）
  - 归一化到 `[0, 1]`
- 显示预测类别与 0~9 概率条形图

### 3. ModelCompare

- 说明三种模型的原理与复杂度
- 展示损失曲线与准确率曲线
- 适合作为教学演示、课程作业或模型部署展示页面

## 技术栈

### 训练与导出

- Python
- PyTorch
- Torchvision
- ONNX
- Matplotlib

### 前端与部署

- React
- Vite
- TypeScript / TSX
- CSS
- ONNX Runtime Web

## 运行建议

1. 首次打开页面前，建议先执行训练脚本生成 ONNX 文件。
2. 若页面提示模型加载失败，请检查：
   - `public/models/` 下是否存在 3 个 `.onnx` 文件。
   - 浏览器是否可访问 `/models/logistic.onnx`、`/models/lenet5.onnx`、`/models/resnet18.onnx`。
3. 若需要替换模型，只要保持输入输出名与形状兼容：
   - 输入名：`input`
   - 输出名：`output`
   - 输入形状：`[batch_size, 1, 28, 28]`

## 适用场景

- 深度学习课程演示
- ONNX 导出与部署教学
- 浏览器端机器学习 Demo
- 模型结构对比实验
- 手写数字识别交互展示

## 许可证说明

本项目代码作为学习、实验与演示用途使用。
