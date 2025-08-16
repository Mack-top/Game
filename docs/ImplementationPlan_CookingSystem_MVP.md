# 实现计划 (Implementation Plan) - 烹饪系统 MVP

## 1. 目标 (Goals)

实现《赛博食谱：夜城送餐人》烹饪系统的最小可行产品 (MVP)，验证核心功能和技术可行性。

**MVP 范围**：
*   能够加载和显示预设的食材、料理和食谱数据。
*   玩家能够选择一个食谱进行烹饪。
*   实现一个最简单的烹饪小游戏（例如：一个简单的点击计时小游戏）。
*   根据小游戏结果和玩家技能，计算并显示料理的最终品质。
*   模拟食材消耗和料理产出。
*   提供基础的UI交互。

## 2. 阶段划分 (Phases)

### 阶段 1: 数据层与基础结构 (Data Layer & Core Structure)

**任务**：
1.  **定义C++结构体**：
    *   在C++中创建 `FIngredientData`, `FDishData`, `FRecipeData`, `FMinigameStepData` 结构体，并继承 `FTableRowBase`，以便在UE5中作为数据表使用。
    *   定义 `EIngredientType`, `EMinigameType`, `EQualityLevel` 枚举。
2.  **创建数据表**：
    *   在UE5内容浏览器中，为 `FIngredientData`, `FDishData`, `FRecipeData` 创建数据表资产（Data Table Asset）。
    *   填充少量测试数据（例如：3-5种食材，2-3种料理，1-2个食谱）。
3.  **创建 `UCookingManagerComponent` C++类**：
    *   创建 `UCookingManagerComponent` 类，并添加必要的成员变量和函数声明（例如：`StartCooking`, `CompleteCookingStep`, `CanCook`）。
    *   添加对数据表的引用，以便加载食材、料理和食谱数据。
4.  **创建 `UBaseMinigame` C++类**：
    *   创建 `UBaseMinigame` 抽象基类，定义 `StartMinigame()`, `EndMinigame()`, `GetPerformanceScore()` 等虚函数。
    *   创建 `UClickTimingMinigame` 子类，实现一个简单的点击计时小游戏逻辑。

**预期产出**：
*   可编译的C++数据结构和枚举。
*   填充了少量测试数据的UE5数据表资产。
*   `UCookingManagerComponent` 和 `UBaseMinigame` 及其子类的C++骨架。

### 阶段 2: UI与交互 (UI & Interaction)

**任务**：
1.  **创建主烹饪UI (WBP_CookingMenu)**：
    *   使用UMG创建一个简单的Widget Blueprint。
    *   包含一个食谱列表（例如：一个简单的文本列表或按钮），显示食谱名称。
    *   一个“开始烹饪”按钮。
    *   一个文本框用于显示当前烹饪状态或结果。
2.  **创建小游戏UI (WBP_Minigame_ClickTiming)**：
    *   为 `UClickTimingMinigame` 创建一个UMG Widget。
    *   包含一个计时器或进度条，一个点击按钮。
3.  **UI与C++绑定**：
    *   在 `WBP_CookingMenu` 的蓝图中，获取 `UCookingManagerComponent` 实例。
    *   将食谱列表绑定到 `UCookingManagerComponent` 提供的数据。
    *   “开始烹饪”按钮调用 `UCookingManagerComponent::StartCooking()`。
    *   `UCookingManagerComponent` 负责在烹饪开始时创建并显示 `WBP_Minigame_ClickTiming`，并在小游戏结束后移除。
    *   `WBP_Minigame_ClickTiming` 将玩家输入传递给 `UClickTimingMinigame` 实例，并将结果返回给 `UCookingManagerComponent`。

**预期产出**：
*   可交互的烹饪主界面。
*   可运行的简单烹饪小游戏界面。
*   UI与后端C++逻辑的基础连接。

### 阶段 3: 核心逻辑实现与模拟集成 (Core Logic & Mock Integration)

**任务**：
1.  **实现 `UCookingManagerComponent` 核心逻辑**：
    *   加载食谱数据，并根据玩家技能过滤可制作食谱。
    *   实现 `StartCooking` 流程：检查食材、启动小游戏序列。
    *   实现 `CompleteCookingStep`：接收小游戏分数，更新内部状态。
    *   实现 `FinalizeCooking`：根据小游戏分数、玩家技能和食材品质（模拟为固定值或随机值）计算最终料理品质。
2.  **模拟库存系统**：
    *   在 `UCookingManagerComponent` 中，简单模拟玩家的食材库存（例如：一个 `TMap<FName, int32> PlayerInventory`）。
    *   在烹饪开始时，从模拟库存中消耗食材。
    *   在烹饪结束时，将制作好的料理添加到模拟库存。
3.  **品质计算器实现**：
    *   实现一个简单的品质计算函数，根据小游戏表现和模拟技能值，返回 `EQualityLevel`。
4.  **测试与调试**：
    *   在游戏世界中放置一个触发器或绑定一个快捷键，用于打开烹饪UI。
    *   进行多次烹饪测试，确保流程顺畅，结果符合预期。

**预期产出**：
*   一个功能完整的烹饪MVP，能够走通“选择食谱 -> 启动小游戏 -> 获得料理”的完整流程。
*   基础的食材消耗和料理产出模拟。

## 3. 技术栈与工具 (Tech Stack & Tools)

*   **游戏引擎**：Unreal Engine 5
*   **编程语言**：C++, Blueprint
*   **UI**：UMG (Unreal Motion Graphics)
*   **数据管理**：Data Tables

## 4. 风险与挑战 (Risks & Challenges)

*   **小游戏设计**：确保小游戏既有趣又具有挑战性，且易于扩展。MVP阶段先实现一个简单的，后续再迭代。
*   **品质计算算法**：找到一个平衡且合理的品质计算公式，能够体现玩家操作和技能的影响。
*   **UI/UX流畅性**：确保烹饪流程的UI交互直观流畅。
*   **数据管理**：随着食谱和食材数量的增加，确保数据表的管理和加载效率。

## 5. 后续迭代 (Next Steps)

MVP完成后，可根据测试反馈和设计文档，逐步加入以下功能：
*   更复杂和多样化的烹饪小游戏。
*   真实的库存系统集成。
*   厨房升级系统。
*   料理增益效果的实现。
*   更精细的品质计算和失败惩罚。
*   音效和视觉特效。