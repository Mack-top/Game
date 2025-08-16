# 设计文档 (Design Document) - 烹饪系统技术架构

## 1. 概述 (Overview)

本文档旨在详细阐述《赛博食谱：夜城送餐人》中烹饪系统的技术架构和数据模型，为开发团队提供实现指导。系统将基于 Unreal Engine 5 (UE5) 进行开发。

## 2. 数据模型 (Data Models)

所有游戏数据将通过数据表 (Data Tables) 或蓝图结构体 (Blueprint Structs) 进行管理，以便于策划配置和迭代。

### 2.1 食材数据 (FIngredientData)

用于定义游戏中的每种食材。

```cpp
// USTRUCT(BlueprintType)
struct FIngredientData : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    FName IngredientID; // 唯一ID，例如：ING_SYNTH_MEAT, ING_ORGANIC_VEG
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    FText DisplayName; // 显示名称，例如：“合成肉”、“有机蔬菜”

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    FText Description; // 描述

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    UTexture2D* Icon; // 图标

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    TEnumAsByte<EIngredientType> Type; // 食材类型：天然、合成

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    int32 BaseValue; // 基础价值

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ingredient")
    UStaticMesh* WorldMesh; // 世界中掉落的3D模型
};

// EIngredientType 枚举
UENUM(BlueprintType)
enum EIngredientType
{
    EIT_Natural UMETA(DisplayName = "Natural"),
    EIT_Synthetic UMETA(DisplayName = "Synthetic"),
    // ... 其他类型
};
```

### 2.2 料理数据 (FDishData)

用于定义游戏中的每种可制作料理。

```cpp
// USTRUCT(BlueprintType)
struct FDishData : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    FName DishID; // 唯一ID，例如：DISH_RAMEN_BASIC, DISH_SUSHI_PREMIUM

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    FText DisplayName; // 显示名称

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    FText Description; // 描述

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    UTexture2D* Icon; // 图标

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    UStaticMesh* WorldMesh; // 世界中料理的3D模型

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    int32 BaseValue; // 基础价值

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dish")
    TArray<FBuffEffectData> BuffEffects; // 食用后提供的增益效果列表
};

// FBuffEffectData 结构体 (假设已定义，包含Buff类型、数值、持续时间等)
// struct FBuffEffectData { ... };
```

### 2.3 食谱数据 (FRecipeData)

用于定义制作料理所需的食谱。

```cpp
// USTRUCT(BlueprintType)
struct FRecipeData : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Recipe")
    FName RecipeID; // 唯一ID，例如：RECIPE_RAMEN_BASIC

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Recipe")
    FName TargetDishID; // 目标料理的DishID

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Recipe")
    TMap<FName, int32> RequiredIngredients; // 所需食材ID及其数量

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Recipe")
    TArray<FMinigameStepData> CookingSteps; // 烹饪步骤列表

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Recipe")
    int32 RequiredCookingSkill; // 制作此食谱所需的最低烹饪技能等级
};

// FMinigameStepData 结构体
// 定义烹饪小游戏的每个步骤
// USTRUCT(BlueprintType)
struct FMinigameStepData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MinigameStep")
    TEnumAsByte<EMinigameType> MinigameType; // 小游戏类型，例如：切割、温度控制

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MinigameStep")
    FText StepDescription; // 步骤描述，例如：“精确切割食材”

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MinigameStep")
    float TargetValue; // 小游戏目标值，例如：切割的完美区域大小，温度控制的目标温度

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "MinigameStep")
    float Tolerance; // 小游戏容差，例如：允许的误差范围

    // ... 其他小游戏特定参数
};

// EMinigameType 枚举
UENUM(BlueprintType)
enum EMinigameType
{
    EMT_RhythmSlicing UMETA(DisplayName = "Rhythm Slicing"),
    EMT_TemperatureControl UMETA(DisplayName = "Temperature Control"),
    EMT_SeasoningProportion UMETA(DisplayName = "Seasoning Proportion"),
    EMT_MixingStirring UMETA(DisplayName = "Mixing Stirring"),
    // ... 其他小游戏类型
};
```

## 3. 核心逻辑模块 (Core Logic Modules)

### 3.1 烹饪管理器 (UCookingManagerComponent)

一个Actor Component，挂载到玩家角色或游戏状态，负责管理烹饪流程。

*   **职责**：
    *   管理玩家已解锁的食谱。
    *   处理烹饪请求。
    *   启动和管理烹饪小游戏序列。
    *   计算料理最终品质。
    *   与库存系统交互，消耗食材，生成料理。
    *   触发UI更新。
*   **关键函数**：
    *   `StartCooking(FName RecipeID)`: 开始烹饪指定食谱。
    *   `AdvanceCookingStep()`: 进入下一个烹饪小游戏步骤。
    *   `CompleteCookingStep(float PerformanceScore)`: 接收小游戏表现分数，更新烹饪进度。
    *   `FinalizeCooking()`: 计算最终料理品质并生成料理。
    *   `CanCook(FName RecipeID)`: 检查玩家是否拥有食谱、足够食材和满足技能要求。

### 3.2 烹饪小游戏基类 (UBaseMinigame)

所有烹饪小游戏的抽象基类。

*   **职责**：
    *   定义小游戏的通用接口（例如：`StartMinigame()`, `EndMinigame()`, `GetPerformanceScore()`）。
    *   处理小游戏状态和计时。
    *   提供事件回调，通知烹饪管理器小游戏完成。
*   **子类**：
    *   `URhythmSlicingMinigame`
    *   `UTemperatureControlMinigame`
    *   `USeasoningProportionMinigame`
    *   `UMixingStirringMinigame`
    *   每个子类实现各自的小游戏逻辑和UI交互。

### 3.3 品质计算器 (FQualityCalculator)

一个静态工具类或服务，用于根据多项输入计算料理品质。

*   **输入**：
    *   玩家烹饪技能等级。
    *   所有烹饪小游戏的表现分数（例如：0-100）。
    *   所用食材的平均品质。
    *   食谱的基础品质。
*   **算法**：加权平均法，或更复杂的非线性函数。
    *   `CalculateDishQuality(int32 CookingSkill, const TArray<float>& MinigameScores, float AverageIngredientQuality)`
*   **输出**：料理品质枚举 (EQualityLevel: Perfect, Good, Average, Failed)。

## 4. UI/UX 实现 (UI/UX Implementation)

使用 Unreal Motion Graphics (UMG) 构建烹饪界面和小游戏界面。

*   **主烹饪UI (WBP_CookingMenu)**：
    *   食谱列表 (Scroll Box)：绑定到 `UCookingManagerComponent` 的食谱数据。
    *   食谱详情面板：显示所需食材、描述。
    *   食材库存显示：实时更新玩家背包中的食材数量和品质。
    *   “开始烹饪”按钮：调用 `UCookingManagerComponent::StartCooking()`。
*   **小游戏UI (WBP_Minigame_RhythmSlicing, WBP_Minigame_TemperatureControl, etc.)**：
    *   每个小游戏对应一个独立的UMG Widget。
    *   由 `UCookingManagerComponent` 在小游戏开始时动态创建并添加到视口。
    *   接收玩家输入，更新小游戏状态，并在结束时将表现分数传递回 `UCookingManagerComponent`。
*   **反馈UI**：
    *   进度条：显示当前烹饪步骤和整体进度。
    *   结果提示：烹饪完成后，显示料理品质（例如：弹出“完美料理！”的提示）。
    *   音效和视觉特效：配合UI反馈。

## 5. 系统集成 (System Integration)

*   **库存系统 (Inventory System)**：
    *   烹饪管理器请求库存系统消耗食材。
    *   库存系统接收并添加制作完成的料理。
*   **角色属性系统 (Character Attributes System)**：
    *   烹饪管理器查询玩家的烹饪技能等级。
    *   食用料理时，角色属性系统应用料理提供的Buff效果。
*   **任务系统 (Quest System)**：
    *   任务系统可能要求玩家制作特定料理。
    *   烹饪完成事件可通知任务系统更新任务进度。
*   **经济系统 (Economy System)**：
    *   料理的价值由其品质决定，影响交易价格。
*   **声望系统 (Reputation System)**：
    *   高品质料理的交付可提升客户声望。

## 6. 厨房升级与定制 (Kitchen Upgrade & Customization)

*   **数据模型**：定义厨房设备升级数据 (FKitchenUpgradeData)，包含升级ID、所需资源、提供的增益（例如：小游戏难度降低、品质加成）。
*   **管理**：由一个独立的 `UKitchenManagerComponent` 管理玩家的厨房状态和已解锁的设备。
*   **效果应用**：厨房设备的增益效果在烹饪管理器计算品质或小游戏逻辑中应用。

## 7. 性能与优化 (Performance & Optimization)

*   **数据表加载**：确保数据表在游戏启动时高效加载，避免运行时卡顿。
*   **小游戏逻辑**：小游戏逻辑应轻量化，避免复杂计算，确保帧率稳定。
*   **UI性能**：UMG Widget应优化，避免过度绘制和复杂动画，特别是对于频繁更新的元素。
*   **内存管理**：合理管理食材、料理、食谱的实例，避免内存泄漏。

## 8. 未来扩展 (Future Expansion)

*   **多人烹饪**：考虑未来加入合作烹饪模式。
*   **随机食谱生成**：根据玩家探索和发现的食材，动态生成新的食谱。
*   **特殊烹饪事件**：在特定剧情或节日期间，触发特殊的烹饪挑战。