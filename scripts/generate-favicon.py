from PIL import Image, ImageDraw

# 使用 4 倍超采样 (1024x1024) 绘制，然后下采样抗锯齿，获得极致细腻质感
CANVAS_SIZE = 1024
im = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(im)

# 贴边绘制圆角矩形 (纯主题色 #4f46e5)
RADIUS = 224
draw.rounded_rectangle([0, 0, CANVAS_SIZE - 1, CANVAS_SIZE - 1], radius=RADIUS, fill=(79, 70, 229, 255))

# 绘制纯白代码符号 < / >
STROKE_WIDTH = 96

# 左尖括号 <
draw.line([(400, 304), (208, 512), (400, 720)], fill=(255, 255, 255, 255), width=STROKE_WIDTH, joint='curve')

# 闭合斜杠 /
draw.line([(576, 272), (448, 752)], fill=(255, 255, 255, 255), width=STROKE_WIDTH)

# 右尖括号 >
draw.line([(624, 304), (816, 512), (624, 720)], fill=(255, 255, 255, 255), width=STROKE_WIDTH, joint='curve')

# 生成标准高质量多图层 ICO (包含 16x16, 32x32, 48x48, 64x64, 128x128)
OUT_ICO = 'public/favicon.ico'
im.save(OUT_ICO, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)])
print(f'Successfully generated 100% transparent alpha favicon.ico at {OUT_ICO}')
