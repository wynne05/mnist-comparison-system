import { useEffect, useRef, useState, type PointerEvent } from "react";

type ModelKey = "logistic" | "lenet5" | "resnet18";

type ModelOption = {
  label: string;
  fileName: string;
  summary: string;
};

type OrtTensorValue = {
  data: ArrayLike<number>;
};

type OrtTensorConstructor = new (
  type: string,
  data: Float32Array,
  dims: readonly number[],
) => OrtTensorValue;

type OrtSession = {
  outputNames: string[];
  run(feeds: Record<string, OrtTensorValue>): Promise<Record<string, OrtTensorValue>>;
};

type OrtApi = {
  env: {
    wasm: {
      wasmPaths?: string;
      numThreads?: number;
      proxy?: boolean;
      simd?: boolean;
    };
  };
  InferenceSession: {
    create(modelUrl: string, options?: { executionProviders?: string[] }): Promise<OrtSession>;
  };
  Tensor: OrtTensorConstructor;
};

declare global {
  interface Window {
    ort?: OrtApi;
  }
}

const ORT_VERSION = "1.26.0";
const ORT_CDN_PREFIX = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const MODEL_OPTIONS: Record<ModelKey, ModelOption> = {
  logistic: {
    label: "Logistic Regression",
    fileName: "logistic.onnx",
    summary: "线性分类器，速度最快，适合做轻量级基线。",
  },
  lenet5: {
    label: "LeNet-5",
    fileName: "lenet5.onnx",
    summary: "经典卷积网络，在 MNIST 上通常兼顾精度与速度。",
  },
  resnet18: {
    label: "ResNet-18",
    fileName: "resnet18.onnx",
    summary: "更深的残差网络，表达能力更强。",
  },
};

function createEmptyProbabilities() {
  return Array.from({ length: 10 }, () => 0);
}

function toProbabilities(logits: number[]) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - maxLogit));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function getArgMax(values: number[]) {
  return values.reduce(
    (bestIndex, currentValue, currentIndex, array) =>
      (currentValue > array[bestIndex] ? currentIndex : bestIndex),
    0,
  );
}

function buildModelUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}models/${fileName}`;
}

function getOrt() {
  const ort = window.ort;
  if (!ort) {
    throw new Error("ONNX Runtime Web 尚未加载完成，请稍后重试。");
  }

  ort.env.wasm.wasmPaths = ORT_CDN_PREFIX;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.simd = true;
  return ort;
}

function preprocessCanvas(sourceCanvas: HTMLCanvasElement) {
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = 28;
  previewCanvas.height = 28;

  const previewContext = previewCanvas.getContext("2d");
  if (!previewContext) {
    throw new Error("无法创建用于预处理的离屏 Canvas。");
  }

  previewContext.fillStyle = "#ffffff";
  previewContext.fillRect(0, 0, 28, 28);
  previewContext.drawImage(sourceCanvas, 0, 0, 28, 28);

  const imageData = previewContext.getImageData(0, 0, 28, 28);
  const floatData = new Float32Array(28 * 28);
  let totalInk = 0;

  for (let index = 0; index < 28 * 28; index += 1) {
    const offset = index * 4;
    const r = imageData.data[offset];
    const g = imageData.data[offset + 1];
    const b = imageData.data[offset + 2];
    const grayscale = (r + g + b) / 3;

    // 用户使用深色笔在白底上书写，因此需要做颜色反转，匹配 MNIST 的白字黑底分布。
    const inverted = 255 - grayscale;
    const normalized = Math.max(0, Math.min(1, inverted / 255));

    floatData[index] = normalized;
    totalInk += normalized;

    const displayValue = normalized * 255;
    imageData.data[offset] = displayValue;
    imageData.data[offset + 1] = displayValue;
    imageData.data[offset + 2] = displayValue;
    imageData.data[offset + 3] = 255;
  }

  previewContext.putImageData(imageData, 0, 0);

  return {
    tensorData: floatData,
    previewUrl: previewCanvas.toDataURL("image/png"),
    inkDensity: totalInk / (28 * 28),
  };
}

export default function Sandbox() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const sessionsRef = useRef<Partial<Record<ModelKey, OrtSession>>>({});
  const sessionPromisesRef = useRef<Partial<Record<ModelKey, Promise<OrtSession>>>>({});

  const [selectedModel, setSelectedModel] = useState<ModelKey>("lenet5");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [probabilities, setProbabilities] = useState<number[]>(() => createEmptyProbabilities());
  const [statusMessage, setStatusMessage] = useState("请在画布上写一个数字。");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 18;
    context.strokeStyle = "#111827";
  }, []);

  const getSession = async (modelKey: ModelKey) => {
    const existingSession = sessionsRef.current[modelKey];
    if (existingSession) {
      return existingSession;
    }

    const existingPromise = sessionPromisesRef.current[modelKey];
    if (existingPromise) {
      return existingPromise;
    }

    setIsModelLoading(true);
    setStatusMessage(`正在加载 ${MODEL_OPTIONS[modelKey].label} 模型...`);

    const promise = getOrt()
      .InferenceSession.create(buildModelUrl(MODEL_OPTIONS[modelKey].fileName), {
        executionProviders: ["wasm"],
      })
      .then((session) => {
        sessionsRef.current[modelKey] = session;
        return session;
      })
      .catch((error: unknown) => {
        throw new Error(
          `模型加载失败，请先运行 training/train_all.py 并确认 public/models/${MODEL_OPTIONS[modelKey].fileName} 已生成。原始错误：${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      })
      .finally(() => {
        setIsModelLoading(false);
        delete sessionPromisesRef.current[modelKey];
      });

    sessionPromisesRef.current[modelKey] = promise;
    return promise;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getSession(selectedModel).catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "模型加载失败。");
        setStatusMessage("当前模型尚未就绪，请检查导出的 ONNX 文件。");
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [selectedModel]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    setPrediction(null);
    setProbabilities(createEmptyProbabilities());
    setPreviewUrl(null);
    setInferenceTime(null);
    setErrorMessage(null);
    setStatusMessage("画布已清空，请重新绘制一个数字。");
  };

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getCanvasPoint(event);

    if (!canvas || !context || !point) {
      return;
    }

    drawingRef.current = true;
    setErrorMessage(null);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    canvas.setPointerCapture(event.pointerId);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    event.preventDefault();
    const context = canvasRef.current?.getContext("2d");
    const point = getCanvasPoint(event);

    if (!context || !point) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const runInference = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setStatusMessage("正在预处理图像...");
    setErrorMessage(null);

    try {
      const { tensorData, previewUrl: nextPreviewUrl, inkDensity } = preprocessCanvas(canvas);
      setPreviewUrl(nextPreviewUrl);

      if (inkDensity < 0.025) {
        setPrediction(null);
        setProbabilities(createEmptyProbabilities());
        setInferenceTime(null);
        setStatusMessage("检测到的笔迹过少，请写得更清晰一些。");
        return;
      }

      const ort = getOrt();
      const session = await getSession(selectedModel);
      setStatusMessage(`正在使用 ${MODEL_OPTIONS[selectedModel].label} 进行推理...`);

      const inputTensor = new ort.Tensor("float32", tensorData, [1, 1, 28, 28]);
      const startedAt = performance.now();
      const results = await session.run({ input: inputTensor });
      const elapsed = performance.now() - startedAt;
      const outputName = session.outputNames[0] ?? "output";
      const outputTensor = results[outputName];

      if (!outputTensor) {
        throw new Error("模型未返回名为 output 的结果张量。");
      }

      const logits = Array.from(outputTensor.data, (value) => Number(value));
      const nextProbabilities = toProbabilities(logits);
      const nextPrediction = getArgMax(nextProbabilities);

      setProbabilities(nextProbabilities);
      setPrediction(nextPrediction);
      setInferenceTime(elapsed);
      setStatusMessage("推理完成，你可以继续修改笔迹并再次触发识别。");
    } catch (error: unknown) {
      setPrediction(null);
      setProbabilities(createEmptyProbabilities());
      setInferenceTime(null);
      setStatusMessage("推理失败，请检查模型文件与浏览器控制台。");
      setErrorMessage(error instanceof Error ? error.message : "推理时出现未知错误。");
    }
  };

  const finishDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    event.preventDefault();
    const canvas = canvasRef.current;
    drawingRef.current = false;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    void runInference();
  };

  return (
    <section className="card section-block sandbox-card">
      <div className="section-heading">
        <span className="section-kicker">Interactive Inference</span>
        <h2>手写数字推理沙箱</h2>
      </div>

      <p className="section-description">
        在白色画布上用深色笔迹书写数字。组件会自动缩放到 28×28、转为灰度、执行颜色反转，
        以匹配 MNIST 的“黑底白字”分布，然后通过 ONNX Runtime Web 在浏览器中运行推理。
      </p>

      <div className="sandbox-toolbar">
        <label className="control-group">
          <span>模型选择</span>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value as ModelKey)}
          >
            {Object.entries(MODEL_OPTIONS).map(([key, option]) => (
              <option key={key} value={key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="secondary-button" type="button" onClick={clearCanvas}>
          Clear
        </button>
      </div>

      <div className="sandbox-layout">
        <div className="canvas-panel">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="digit-canvas"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
            aria-label="Handwriting canvas"
          />
          <p className="canvas-hint">支持鼠标、触控板和触屏设备输入；松开后自动触发推理。</p>
        </div>

        <div className="result-panel">
          <div className="result-summary">
            <div>
              <span className="result-label">当前模型</span>
              <strong>{MODEL_OPTIONS[selectedModel].label}</strong>
              <p className="muted-text">{MODEL_OPTIONS[selectedModel].summary}</p>
            </div>

            <div className="prediction-badge">
              <span>预测结果</span>
              <strong>{prediction ?? "-"}</strong>
            </div>
          </div>

          <div className="status-box">
            <p>{statusMessage}</p>
            {isModelLoading ? <span className="status-pill">模型加载中</span> : null}
            {inferenceTime !== null ? (
              <span className="status-pill">{inferenceTime.toFixed(1)} ms</span>
            ) : null}
          </div>

          {previewUrl ? (
            <div className="preview-box">
              <span>28×28 预处理结果</span>
              <img src={previewUrl} alt="预处理后的 28x28 输入图像" />
            </div>
          ) : null}

          {errorMessage ? <div className="error-box">{errorMessage}</div> : null}

          <div className="probability-card">
            <h3>类别概率分布</h3>
            <div className="probability-list">
              {probabilities.map((probability, digit) => (
                <div className="probability-row" key={digit}>
                  <span className="digit-label">{digit}</span>
                  <div className="probability-track">
                    <div
                      className={digit === prediction ? "probability-fill active" : "probability-fill"}
                      style={{ width: `${Math.max(probability * 100, probability > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <strong>{(probability * 100).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
