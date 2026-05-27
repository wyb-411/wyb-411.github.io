# 像素小猫光标

我想让网站的鼠标指针变成一只很小的小猫。它不需要太复杂，只要跟着光标走，停下来时乖乖睡觉。

## 交互规则

1. 移动时保持清醒。
2. 5 秒不动后趴下。
3. 睡觉时出现很轻的 `Zzz`。
4. 点击时眨眼或轻轻压扁一下。

```css
.cat-cursor {
  position: fixed;
  pointer-events: none;
  transform: translate3d(var(--x), var(--y), 0);
}
```

## 小猫的样子

- 灰白身体
- 粗黑描边
- 大大的眼睛
- 粉色耳朵
- 圆圆尾巴

![小猫桌面](/images/art/cat-desk.svg)
