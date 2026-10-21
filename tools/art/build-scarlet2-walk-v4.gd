var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v4/'
var older='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v2/'
var previous='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v3/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
var bounds_se=[[[54,57],[53,57],[53,57],[52,57],[51,57],[50,56],[50,55],[49,55],[48,54],[48,54],[47,53],[46,51],[46,50],[47,50],[49,50]],[[69,72],[68,72],[70,75],[71,77],[71,77],[72,78],[72,78],[73,79],[74,82],[74,83],[75,82],[77,82],[77,82],[76,82],[77,82],[78,81]]]
var bounds_ne=[[[56,60],[55,60],[54,60],[53,60],[53,59],[52,58],[52,57],[51,56],[50,54],[48,54],[49,54],[50,53]],[[70,75],[70,75],[70,75],[70,76],[70,76],[71,77],[71,78],[73,79],[74,80],[73,81],[74,81],[76,83],[76,82],[78,83],[78,84],[78,84],[79,83],[80,82]]]
func in_arm(x:int,y:int,arm:int,d:String)->bool:
	var table=bounds_se[arm] if d=='se' else bounds_ne[arm]
	var row=y-79
	return row>=0 and row<table.size() and x>=table[row][0] and x<=table[row][1]
func in_gear(x:int,y:int,d:String)->bool:
	var points=PackedVector2Array([Vector2(70,85),Vector2(76,88),Vector2(80,94),Vector2(76,99),Vector2(67,94),Vector2(67,90)]) if d=='se' else PackedVector2Array([Vector2(73,85),Vector2(78,89),Vector2(80,95),Vector2(75,99),Vector2(70,94),Vector2(70,89)])
	return Geometry2D.is_point_in_polygon(Vector2(x,y),points)
func neutral(api,d:String)->Image:
	var core=Image.load_from_file(previous+'core-'+d+'-1.png')
	var source=core.duplicate()
	for y in range(81,99):
		for x in range(42,88):
			if not (in_arm(x,y,0,d) or in_arm(x,y,1,d)):continue
			var safe=x>=58 and x<=68 and y<=88 if d=='se' else x>=61 and x<=70 and y<=87
			if safe:continue
			core.set_pixel(x,y,Color.TRANSPARENT)
			if not in_gear(x,y,d):continue
			var fill=Color('#663c8c')
			var found=false
			for dist in range(1,8):
				if found:break
				for dx in [-dist,dist]:
					var sx=x+dx
					if sx<0 or sx>=128 or in_arm(sx,y,0,d) or in_arm(sx,y,1,d) or not in_gear(sx,y,d):continue
					var c=source.get_pixel(sx,y)
					if c.a>0.5:
						fill=c
						found=true
						break
			core.set_pixel(x,y,fill)
	if d=='se':
		# The sheath stays on the belt after the formerly overlapping hand is removed.
		for x in range(76,83):
			var y=92+int(round(float(x-76)*0.4))
			core.set_pixel(x,y+1,Color('#352438'))
			core.set_pixel(x,y,Color('#efeaf4' if x>77 else '#c49c55'))
	else:
		core.set_pixel(79,85,Color.TRANSPARENT)
	return core
func arm_image(api,d:String,n:int,arm:int)->Image:
	var master=Image.load_from_file(standing+'idle-'+d+'.png')
	var anchor=Vector2(55,80) if arm==0 else Vector2(72,80)
	var angles=[-20,-8,-5,0] if arm==0 else [20,8,-10,5]
	var flexes=[-45,-15,35,5] if arm==0 else [70,25,-15,20]
	var elbow=Vector2(51,85) if arm==0 else Vector2(76,85)
	if d=='ne':
		anchor=Vector2(59,80) if arm==0 else Vector2(73,80)
		angles=[-20,-15,-10,-10] if arm==0 else [20,8,-10,5]
		flexes=[-85,-35,0,-30] if arm==0 else [70,30,-10,20]
		elbow=Vector2(55,84) if arm==0 else Vector2(76,86)
	var angle=deg_to_rad(angles[n])
	var fore_angle=angle+deg_to_rad(flexes[n])
	var bent_elbow=anchor+(elbow-anchor).rotated(angle)
	var result=api.create_image(128,128)
	for segment in range(2):
		for y in range(80,104):
			for x in range(38,96):
				var sample=(Vector2(x,y)-anchor).rotated(-angle)+anchor if segment==0 else (Vector2(x,y)-bent_elbow).rotated(-fore_angle)+elbow
				var sx=int(round(sample.x))
				var sy=int(round(sample.y))
				if not in_arm(sx,sy,arm,d):continue
				if (segment==0 and sy>elbow.y+1) or (segment==1 and sy<elbow.y-1):continue
				var c=master.get_pixel(sx,sy)
				if c.a>0.5:result.set_pixel(x,y,c)
	return result
func render(api,d:String,n:int,canonical:Image)->Dictionary:
	var bob=-1 if n%2==1 else 0
	var base=Image.load_from_file(older+'frame-'+d+'-'+str(n+1)+'.png')
	var legs=api.create_image(128,128)
	legs.blit_rect(base,Rect2i(42,93,43,35),Vector2i(42,93))
	var core=api.create_image(128,128)
	core.blit_rect(canonical,Rect2i(0,0,128,128),Vector2i(0,bob))
	var near=api.create_image(128,128)
	var far=api.create_image(128,128)
	near.blit_rect(arm_image(api,d,n,0),Rect2i(0,0,128,128),Vector2i(0,bob))
	far.blit_rect(arm_image(api,d,n,1),Rect2i(0,0,128,128),Vector2i(0,bob))
	# Four independent native layers: legs, rear arm, coherent torso, visible front arm.
	var full=legs.duplicate()
	full.blend_rect(far,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.blend_rect(core,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.blend_rect(near,Rect2i(0,0,128,128),Vector2i.ZERO)
	return {'legs':legs,'far':far,'core':core,'near':near,'frame':full}
func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'))
	var canonical=neutral(api,d)
	canonical.save_png(root+'neutral-'+d+'.png')
	var sheets={}
	for kind in ['legs','far','core','near','frame']:sheets[kind]=api.create_image(512,128)
	for n in range(4):
		var pieces=render(api,d,n,canonical)
		for kind in pieces:
			pieces[kind].save_png(root+kind+'-'+d+'-'+str(n+1)+'.png')
			sheets[kind].blit_rect(pieces[kind],Rect2i(0,0,128,128),Vector2i(n*128,0))
	for kind in sheets:sheets[kind].save_png(root+kind+'-sheet-'+d+'.png')
	return render(api,d,0,canonical).legs
