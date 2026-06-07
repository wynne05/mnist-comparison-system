from __future__ import annotations

import argparse
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_OUTPUT_DIR = PROJECT_ROOT / "public" / "models"
ASSET_OUTPUT_DIR = PROJECT_ROOT / "src" / "assets"
DATA_DIR = PROJECT_ROOT / "training" / "data"
PUBLIC_CHART_DIR = PROJECT_ROOT / "public" / "charts"


class LogisticRegression(nn.Module):
    """A simple linear classifier over flattened 28x28 grayscale images."""

    def __init__(self) -> None:
        super().__init__()
        self.classifier = nn.Linear(28 * 28, 10)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x.view(x.size(0), -1)
        return self.classifier(x)


class LeNet5(nn.Module):
    """LeNet-5 adapted for MNIST 1x28x28 input."""

    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 6, kernel_size=5),
            nn.ReLU(inplace=True),
            nn.AvgPool2d(kernel_size=2, stride=2),
            nn.Conv2d(6, 16, kernel_size=5),
            nn.ReLU(inplace=True),
            nn.AvgPool2d(kernel_size=2, stride=2),
        )
        self.classifier = nn.Sequential(
            nn.Linear(16 * 4 * 4, 120),
            nn.ReLU(inplace=True),
            nn.Linear(120, 84),
            nn.ReLU(inplace=True),
            nn.Linear(84, 10),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)


class CustomResNet18(nn.Module):
    """ResNet-18 modified for grayscale MNIST input and 10-class output."""

    def __init__(self) -> None:
        super().__init__()
        backbone = models.resnet18(weights=None)
        backbone.conv1 = nn.Conv2d(
            in_channels=1,
            out_channels=64,
            kernel_size=7,
            stride=2,
            padding=3,
            bias=False,
        )
        backbone.fc = nn.Linear(backbone.fc.in_features, 10)
        self.backbone = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)


@dataclass
class TrainingHistory:
    train_loss: List[float] = field(default_factory=list)
    val_accuracy: List[float] = field(default_factory=list)


@dataclass
class ModelSpec:
    key: str
    display_name: str
    model: nn.Module
    learning_rate: float
    history: TrainingHistory = field(default_factory=TrainingHistory)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train 3 MNIST models and export them to ONNX.")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs for each model.")
    parser.add_argument("--batch-size", type=int, default=128, help="Training batch size.")
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=None,
        help="Optional global learning rate override for all models.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    return parser.parse_args()


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def count_parameters(model: nn.Module) -> int:
    return sum(parameter.numel() for parameter in model.parameters() if parameter.requires_grad)


def create_dataloaders(batch_size: int) -> Tuple[DataLoader, DataLoader]:
    transform = transforms.ToTensor()

    train_dataset = datasets.MNIST(root=DATA_DIR, train=True, download=True, transform=transform)
    test_dataset = datasets.MNIST(root=DATA_DIR, train=False, download=True, transform=transform)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=torch.cuda.is_available(),
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=torch.cuda.is_available(),
    )
    return train_loader, test_loader


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
) -> float:
    model.train()
    running_loss = 0.0
    total_samples = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad(set_to_none=True)
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        batch_size = labels.size(0)
        running_loss += loss.item() * batch_size
        total_samples += batch_size

    return running_loss / total_samples


@torch.no_grad()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    correct = 0
    total = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        logits = model(images)
        predictions = torch.argmax(logits, dim=1)

        total += labels.size(0)
        correct += (predictions == labels).sum().item()

    return 100.0 * correct / total


def plot_histories(model_specs: Iterable[ModelSpec]) -> None:
    ASSET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(9, 6))
    for spec in model_specs:
        epochs = range(1, len(spec.history.train_loss) + 1)
        plt.plot(epochs, spec.history.train_loss, marker="o", linewidth=2, label=spec.display_name)
    plt.title("Training Loss Comparison")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True, linestyle="--", alpha=0.35)
    plt.legend()
    plt.tight_layout()
    plt.savefig(ASSET_OUTPUT_DIR / "loss_curve.png", dpi=220)
    plt.close()

    plt.figure(figsize=(9, 6))
    for spec in model_specs:
        epochs = range(1, len(spec.history.val_accuracy) + 1)
        plt.plot(epochs, spec.history.val_accuracy, marker="o", linewidth=2, label=spec.display_name)
    plt.title("Validation Accuracy Comparison")
    plt.xlabel("Epoch")
    plt.ylabel("Validation Accuracy (%)")
    plt.grid(True, linestyle="--", alpha=0.35)
    plt.legend()
    plt.tight_layout()
    plt.savefig(ASSET_OUTPUT_DIR / "acc_curve.png", dpi=220)
    plt.close()


def export_onnx(model: nn.Module, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    model = model.cpu().eval()
    dummy_input = torch.randn(1, 1, 28, 28, dtype=torch.float32)

    torch.onnx.export(
        model,
        dummy_input,
        destination.as_posix(),
        export_params=True,
        opset_version=18,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )


def train_model(
    spec: ModelSpec,
    train_loader: DataLoader,
    test_loader: DataLoader,
    device: torch.device,
    epochs: int,
) -> None:
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(spec.model.parameters(), lr=spec.learning_rate)
    spec.model.to(device)

    print(f"\n=== Training {spec.display_name} ===")
    print(f"Trainable parameters: {count_parameters(spec.model):,}")

    for epoch in range(1, epochs + 1):
        train_loss = train_one_epoch(spec.model, train_loader, criterion, optimizer, device)
        val_accuracy = evaluate(spec.model, test_loader, device)

        spec.history.train_loss.append(train_loss)
        spec.history.val_accuracy.append(val_accuracy)

        print(
            f"Epoch {epoch:02d}/{epochs:02d} | "
            f"train_loss={train_loss:.4f} | val_accuracy={val_accuracy:.2f}%"
        )

    onnx_path = MODEL_OUTPUT_DIR / f"{spec.key}.onnx"
    export_onnx(spec.model, onnx_path)
    print(f"Exported ONNX model to: {onnx_path}")


def main() -> None:
    args = parse_args()
    set_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_loader, test_loader = create_dataloaders(args.batch_size)

    learning_rate_override = args.learning_rate
    model_specs = [
        ModelSpec(
            key="logistic",
            display_name="Logistic Regression",
            model=LogisticRegression(),
            learning_rate=learning_rate_override if learning_rate_override is not None else 1e-2,
        ),
        ModelSpec(
            key="lenet5",
            display_name="LeNet-5",
            model=LeNet5(),
            learning_rate=learning_rate_override if learning_rate_override is not None else 1e-3,
        ),
        ModelSpec(
            key="resnet18",
            display_name="ResNet-18",
            model=CustomResNet18(),
            learning_rate=learning_rate_override if learning_rate_override is not None else 1e-3,
        ),
    ]

    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_CHART_DIR.mkdir(parents=True, exist_ok=True)

    for spec in model_specs:
        train_model(spec, train_loader, test_loader, device, args.epochs)

    plot_histories(model_specs)

    print("\n=== Training Summary ===")
    for spec in model_specs:
        final_loss = spec.history.train_loss[-1]
        final_acc = spec.history.val_accuracy[-1]
        print(f"{spec.display_name:<20} loss={final_loss:.4f} | val_accuracy={final_acc:.2f}%")

    print(f"\nSaved plots to: {ASSET_OUTPUT_DIR}")
    print(f"Saved ONNX models to: {MODEL_OUTPUT_DIR}")


if __name__ == "__main__":
    main()
