// 1. 替换为真实的 MNIST 训练集分布数据
const classDistribution = [
  { digit: 0, count: "5,923张", share: 9.87 },
  { digit: 1, count: "6,742张", share: 11.24 },
  { digit: 2, count: "5,958张", share: 9.93 },
  { digit: 3, count: "6,131张", share: 10.22 },
  { digit: 4, count: "5,842张", share: 9.74 },
  { digit: 5, count: "5,421张", share: 9.04 },
  { digit: 6, count: "5,918张", share: 9.86 },
  { digit: 7, count: "6,265张", share: 10.44 },
  { digit: 8, count: "5,851张", share: 9.75 },
  { digit: 9, count: "5,949张", share: 9.92 },
];

const sampleDigits = [
  { value: "7", imgUrl: "/mnist-samples/digit_7.png" },
  { value: "2", imgUrl: "/mnist-samples/digit_2.png" },
  { value: "1", imgUrl: "/mnist-samples/digit_1.png" },
  { value: "0", imgUrl: "/mnist-samples/digit_0.png" },
  { value: "4", imgUrl: "/mnist-samples/digit_4.png" },
  { value: "9", imgUrl: "/mnist-samples/digit_9.png" },
  { value: "6", imgUrl: "/mnist-samples/digit_6.png" },
  { value: "3", imgUrl: "/mnist-samples/digit_3.png" },
  { value: "8", imgUrl: "/mnist-samples/digit_8.png" },
  { value: "5", imgUrl: "/mnist-samples/digit_5.png" },
];

const datasetFacts = [
  { label: "训练集", value: "60,000" },
  { label: "测试集", value: "10,000" },
  { label: "图像分辨率", value: "28 × 28" },
  { label: "类别数", value: "10" },
];

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

      {/* 2. 在这里加入行内样式，确保在宽屏下左右并排，在窄屏（如手机）下自动折行 */}
      <div 
        className="dataset-panels" 
        style={{ 
          display: "flex", 
          flexDirection: "row", 
          flexWrap: "wrap", 
          gap: "24px",
          marginTop: "24px"
        }}
      >
        {/* 左侧面板：占弹性盒子的一半宽度 */}
        <div className="sub-card" style={{ flex: 1, minWidth: "300px" }}>
          <h3>示例手写数字</h3>
          <div className="digit-grid" aria-label="MNIST sample digits">
            {sampleDigits.map((digit, index) => (
              <div className="digit-tile" key={`${digit.value}-${index}`}>
                <img
                  src={digit.imgUrl}
                  alt={`MNIST digit ${digit.value}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    backgroundColor: "#000",
                    borderRadius: "4px"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 右侧面板：占弹性盒子的另一半宽度 */}
        <div className="sub-card" style={{ flex: 1, minWidth: "300px" }}>
          <h3>类别分布</h3>
          <p className="muted-text">MNIST 训练集各类别总体较为均衡（总数 60,000 张）。</p>
          <div className="class-distribution" style={{ marginTop: "16px" }}>
            {classDistribution.map((item) => (
              <div className="distribution-row" key={item.digit} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ width: "20px", fontWeight: "bold" }}>{item.digit}</span>
                
                {/* 进度条背景 */}
                <div className="distribution-bar" style={{ flex: 1, backgroundColor: "#eee", height: "12px", borderRadius: "6px", margin: "0 12px", overflow: "hidden" }}>
                  {/* 进度条填充：乘以 8 使得最大值（11.24%）填充约 90% 的宽度，视觉效果最好 */}
                  <div style={{ width: `${item.share * 8}%`, backgroundColor: "#4f46e5", height: "100%", borderRadius: "6px" }} />
                </div>
                
                {/* 右侧数值展示 */}
                <strong style={{ width: "80px", textAlign: "right", fontSize: "0.9rem" }}>
                  {item.share}% <span style={{ fontWeight: "normal", color: "#666", fontSize: "0.8rem" }}>({item.count})</span>
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}