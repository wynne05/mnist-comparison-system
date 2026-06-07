const sampleDigits = [
  { value: "7", rotate: "-8deg", size: "2.4rem", family: "Georgia, serif" },
  { value: "2", rotate: "6deg", size: "2.3rem", family: '"Trebuchet MS", sans-serif' },
  { value: "1", rotate: "-3deg", size: "2.5rem", family: '"Courier New", monospace' },
  { value: "0", rotate: "5deg", size: "2.2rem", family: '"Times New Roman", serif' },
  { value: "4", rotate: "-7deg", size: "2.4rem", family: '"Verdana", sans-serif' },
  { value: "9", rotate: "8deg", size: "2.35rem", family: '"Lucida Handwriting", cursive' },
  { value: "6", rotate: "-6deg", size: "2.25rem", family: '"Palatino Linotype", serif' },
  { value: "3", rotate: "7deg", size: "2.25rem", family: '"Comic Sans MS", cursive' },
  { value: "8", rotate: "-4deg", size: "2.3rem", family: '"Gill Sans", sans-serif' },
  { value: "5", rotate: "4deg", size: "2.25rem", family: '"Brush Script MT", cursive' },
];

const datasetFacts = [
  { label: "训练集", value: "60,000" },
  { label: "测试集", value: "10,000" },
  { label: "图像分辨率", value: "28 × 28" },
  { label: "类别数", value: "10" },
];

const classDistribution = Array.from({ length: 10 }, (_, index) => ({
  digit: index,
  share: 10,
}));

export default function DatasetIntro() {
  return (
    <section className="card section-block">
      <div className="section-heading">
        <span className="section-kicker">Dataset Overview</span>
        <h2>MNIST 数据集简介</h2>
      </div>

      <p className="section-description">
        MNIST 是机器学习领域最经典的手写数字识别基准数据集之一。每张图像都是
        28×28 的单通道灰度图，像素值范围通常归一化到 0~1，标签为 0 到 9 中的一个数字。
        它非常适合用于教学、模型对比与前端推理演示。
      </p>

      <div className="stats-grid">
        {datasetFacts.map((item) => (
          <div className="stat-box" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="dataset-panels">
        <div className="sub-card">
          <h3>示例手写数字</h3>
          <div className="digit-grid" aria-label="MNIST sample digits">
            {sampleDigits.map((digit, index) => (
              <div className="digit-tile" key={`${digit.value}-${index}`}>
                <span
                  style={{
                    transform: `rotate(${digit.rotate})`,
                    fontSize: digit.size,
                    fontFamily: digit.family,
                  }}
                >
                  {digit.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sub-card">
          <h3>类别分布</h3>
          <p className="muted-text">MNIST 各类别总体较为均衡，适合分类基准比较。</p>
          <div className="class-distribution">
            {classDistribution.map((item) => (
              <div className="distribution-row" key={item.digit}>
                <span>{item.digit}</span>
                <div className="distribution-bar">
                  <div style={{ width: `${item.share * 10}%` }} />
                </div>
                <strong>{item.share}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
