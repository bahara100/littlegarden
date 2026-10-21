# Approved V2 head/colours + continuous seated wardrobe referenced to the common body.
# No hip/leg splice and no replacement of a horizontal row of boots.
var root='C:/nikke-playground/docs/art/pixel/scarlet2-sit-v2/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
var old='C:/nikke-playground/docs/art/pixel/scarlet2-sit-v1/'

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

func boot_patch(body:Image,origin:Vector2i,rows:Array):
	var ink={'W':'#fffdf9','H':'#efeaf4','h':'#d9d1e2','s':'#9f96ac','S':'#7e758a','D':'#332e40','o':'#210d28','g':'#c49c55','G':'#f6dca0'}
	for j in range(rows.size()):
		for i in range(rows[j].length()):
			var symbol=rows[j][i]
			if symbol=='.':continue
			var x=origin.x+i
			var y=origin.y+j
			var c=body.get_pixel(x,y)
			# Preserve the original silhouette and its deepest contour; only paint inside the boot.
			if c.a<0.7 or max(c.r,max(c.g,c.b))<0.28:continue
			body.set_pixel(x,y,Color(ink[symbol]))

func restore_boots(body:Image,dir:String):
	# Match approved standing boot materials: smooth white right boot, folded left boot,
	# charcoal ankle band, clear front planes and a narrow gold welt above the sole.
	if dir=='se':
		boot_patch(body,Vector2i(56,106),[
			'ooDDDDDDDo','ooShhhhHSo','oSshWWWWHo','oShWWWWWHo',
			'oSshWWWHSo','.oSshWWHSo','...oGggGoo','....oooooo'])
		boot_patch(body,Vector2i(66,103),[
			'ssSSssHoo','hWWWWWHoo','ssHHssHoo','DDDDDDDoo',
			'SHWWWHHoo','sHHHWWWHo','hWWWWHHHo','ShWWWHHHo',
			'hWWWWWWHo','oGggggGoo','.ooooooo.'])
	else:
		boot_patch(body,Vector2i(65,101),[
			'..oDDDWoo','..oHHssSo','.oShWWWSo','oShssHHSo',
			'oShWWWWHo','.oShssHSo','..oGggGoo','...oooooo'])
		boot_patch(body,Vector2i(74,104),[
			'DDDDDDHoo','ShWWWWHSo','ShWWWWHSo','ShWWWWHSo',
			'oShWWWHoo','.oGggGoo.','..ooooo..'])

func run(api,image:Image,project,params:Dictionary):
	var dir=str(params.get('dir','se'))
	var source=Image.load_from_file(old+'aligned-costume-'+dir+'.png')
	var palette=[]
	for value in JSON.parse_string(FileAccess.get_file_as_string(standing+'palette.json')):
		palette.append(Color(value))
	var head=api.create_image(128,128)
	head.blit_rect(Image.load_from_file(standing+'head-'+dir+'.png'),Rect2i(0,0,128,128),Vector2i(0,0) if dir=='se' else Vector2i(-3,0))
	var body=api.create_image(128,128)
	var reference=api.create_image(128,128)
	# Uniform fit of the COMPLETE body from the neck down to the common seated foot height.
	# x/width stay unchanged. The torso, waist, thighs and boots use one continuous transform.
	var source_height=42 if dir=='se' else 38
	var target_height=38 if dir=='se' else 35
	var cache={}
	for y in range(76,76+target_height):
		var sy=76+int(floor((y-76+0.5)*source_height/float(target_height)))
		for x in range(128):
			var c=source.get_pixel(x,sy)
			if c.a<0.7: continue
			reference.set_pixel(x,y,c)
			body.set_pixel(x,y,nearest(c,palette,cache))
	restore_boots(body,dir)
	var full=body.duplicate()
	full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
	var parts={'body':body,'head':head,'sit':full,'reference-body':reference}
	for name in parts:
		parts[name].save_png(root+name+'-'+dir+'.png')
	return parts[str(params.get('part','sit'))]
