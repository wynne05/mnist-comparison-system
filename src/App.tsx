import "./App.css";
import DatasetIntro from "./components/DatasetIntro";
import ModelCompare from "./components/ModelCompare";
import Sandbox from "./components/Sandbox";

const workflowSteps = [
  {
    title: "PyTorch 训练",
    description: "使用 MNIST 数据集分别训练 Logistic Regression、LeNet-5 与 ResNet-18。",
  },
  {
    title: "导出 ONNX",
    description: "将三种模型统一导出为 ONNX，输入张量固定为 [batch, 1, 28, 28]。",
  },
  {
    title: "浏览器本地推理",
    description: "前端借助 ONNX Runtime Web 在浏览器中完成无服务器手写数字识别。",
  },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">React + PyTorch + ONNX Runtime Web</span>
          <h1>MNIST 多模型推理与可视化实验台</h1>
          <p>
            在同一块画布上体验 3 种经典模型的推理表现，观察训练曲线，并理解
            PyTorch 训练、ONNX 导出与浏览器端推理的完整闭环。
          </p>

          <div className="hero-metrics">
            <div className="metric-card">
              <strong>3</strong>
              <span>种模型</span>
            </div>
            <div className="metric-card">
              <strong>28×28</strong>
              <span>灰度输入</span>
            </div>
            <div className="metric-card">
              <strong>60k / 10k</strong>
              <span>训练 / 测试样本</span>
            </div>
          </div>
        </div>

        <div className="hero-panel card">
          <h2>端到端工作流</h2>
          <div className="workflow-list">
            {workflowSteps.map((step, index) => (
              <div className="workflow-item" key={step.title}>
                <div className="workflow-index">0{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="sandbox-column">
          <Sandbox />
        </section>

        <section className="insight-column">
          <DatasetIntro />
          <ModelCompare />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          训练脚本会导出 ONNX 模型到 <code>public/models</code>，并生成曲线图到
          <code>src/assets</code>，前端即可直接消费这些产物。
        </p>
      </footer>
    </div>
  );
}
