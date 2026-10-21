# Restore source colours and continuous anatomy in a NEW revision. Never splice a row of base legs.
var root='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
var old='C:/nikke-playground/docs/art/pixel/scarlet2-base-v1/'

func nearest(c:Color,palette:Array,cache:Dictionary)->Color:
	var key=c.to_rgba32()
	if cache.has(key): return cache[key]
	var best=palette[0]
	var score=99.0
	for p in palette:
		var d=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
		if d<score:
			score=d
			best=p
	cache[key]=best
	return best

func run(api,image:Image,project,params:Dictionary):
	var dir=str(params.get('dir','se'))
	var source=Image.load_from_file(old+('aligned-ai-se.png' if dir=='se' else 'rear/aligned-ai-ne.png'))
	var palette=[]
	for value in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):
		palette.append(Color(value))
	var full=api.create_image(128,128)
	var head=api.create_image(128,128)
	var body=api.create_image(128,128)
	var cache={}
	for y in range(128):
		for x in range(128):
			var sy=y if dir=='se' else y-1
			if sy<0:continue
			var c=source.get_pixel(x,sy)
			if c.a<0.7:continue
			var value=nearest(c,palette,cache)
			full.set_pixel(x,y,value)
			# Split only AFTER the continuous full frame is complete; no anatomy is replaced.
			var part=head if y<77 else body
			part.set_pixel(x,y,value)
	var parts={'head':head,'body':body,'idle':full}
	for name in parts:
		parts[name].save_png(root+name+'-'+dir+'.png')
	return parts[str(params.get('part','idle'))]
