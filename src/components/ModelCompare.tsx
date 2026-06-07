const lossCurve = `${import.meta.env.BASE_URL}charts/loss_curve.png`;
const accCurve = `${import.meta.env.BASE_URL}charts/acc_curve.png`;

const modelCards = [
  {
    name: "Logistic Regression",
    params: "约 7.8K 参数",
    accuracy: "约 91% ~ 93%",
    latency: "极快",
    description:
      "将 28×28 图像直接展平为 784 维向量，并通过单层线性分类器输出 10 类结果。结构最简单、推理速度最快，但对空间局部结构的建模能力有限。",
  },
  {
    name: "LeNet-5",
    params: "约 44K 参数",
    accuracy: "约 98.5% ~ 99.2%",
    latency: "快速",
    description:
      "经典卷积神经网络，依次提取局部纹理、边缘与形状特征，再使用全连接层完成分类。在 MNIST 这类小尺寸数字任务上通常表现稳定且高效。",
  },
  {
    name: "ResNet-18",
    params: "约 11.2M 参数",
    accuracy: "约 99.1% ~ 99.4%",
    latency: "中等",
    description:
      "引入残差连接，能够训练更深的网络并提升特征表达能力。虽然参数量显著高于前两者，但通常能获得最强的泛化效果与最高精度。",
  },
];

export default function ModelCompare() {
  return (
    <section className="card section-block">
      <div className="section-heading">
        <span className="section-kicker">Model Comparison</span>
        <h2>三种模型架构对比</h2>
      </div>

      <div className="model-card-grid">
        {modelCards.map((model) => (
          <article className="comparison-card" key={model.name}>
            <h3>{model.name}</h3>
            <div className="tag-row">
              <span>{model.params}</span>
              <span>{model.accuracy}</span>
              <span>{model.latency}</span>
            </div>
            <p>{model.description}</p>
          </article>
        ))}
      </div>

      <div className="chart-grid">
        <figure className="chart-card">
          <img src={lossCurve} alt="三种模型训练损失对比曲线" />
          <figcaption>loss_curve.png：训练损失随 epoch 下降的对比。</figcaption>
        </figure>

        <figure className="chart-card">
          <img src={accCurve} alt="三种模型验证准确率对比曲线" />
          <figcaption>acc_curve.png：验证准确率随 epoch 提升的对比。</figcaption>
        </figure>
      </div>
    </section>
  );
}
