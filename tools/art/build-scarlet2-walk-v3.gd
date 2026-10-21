var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v3/'
var old='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v2/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
func skin(c:Color)->bool:
	return c.a>0.5 and ['ba7d69','da9b80','eeb499','f5c9ae','fde1cf','ffe9da'].has(c.to_html(false))
func inside(x:int,y:int,points:Array)->bool:
	var p=PackedVector2Array()
	for v in points:p.append(Vector2(v[0],v[1]))
	return Geometry2D.is_point_in_polygon(Vector2(x+0.5,y+0.5),p)
func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'))
	var n=int(params.get('frame',0))
	var part=str(params.get('part','core'))
	var bob=-1 if n%2==1 else 0
	var master=Image.load_from_file(standing+'idle-'+d+'.png')
	var canonical=api.create_image(128,128)
	for y in range(128):
		for x in range(128):
			var c=master.get_pixel(x,y)
			if c.a<0.5:continue
			var keep=y<=80
			if d=='se':
				keep=keep or (y<=88 and x>=56 and x<=72) or (y>=88 and y<=92 and x>=54 and x<=75)
				keep=keep or (y>=89 and y<=96 and x>=59 and x<=66 and not skin(c))
				keep=keep or (y>=85 and y<=98 and x>=70 and x<=79 and not skin(c))
				keep=keep or (y>=87 and y<=104 and x>=80 and not skin(c))
				keep=keep or (y>=89 and y<=95 and x>=52 and x<=57 and not skin(c))
			else:
				keep=keep or (y<=87 and x>=58 and x<=73)
				keep=keep or (y>=84 and y<=95 and x>=53 and x<=76 and not skin(c))
				keep=keep or (y>=85 and y<=97 and x>=73 and x<=80 and not skin(c))
				keep=keep or (y>=86 and y<=101 and x<=53 and not skin(c))
			if keep:canonical.set_pixel(x,y,c)
	var limbs=api.create_image(128,128)
	var source=Image.load_from_file(old+'frame-'+d+'-'+str(n+1)+'.png')
	for y in range(77,128):
		for x in range(128):
			var sy=y+bob
			if sy<0 or sy>=128:continue
			var c=source.get_pixel(x,sy)
			if c.a<0.5:continue
			var leg=y>=93 and x>=42 and x<=84
			if leg:limbs.set_pixel(x,y,c)
	# Complete approved arms pivot at the shoulders. Do not reuse disconnected cropped fists.
	var arm_polys=[[[54,77],[59,80],[55,86],[52,94],[45,94],[44,88],[49,82]],[[69,77],[74,77],[78,83],[83,88],[83,94],[76,94],[74,88],[71,84]]]
	var anchors=[Vector2(55,80),Vector2(72,80)]
	if d=='ne':
		arm_polys=[[[57,77],[62,80],[59,84],[56,89],[54,94],[48,94],[48,88],[53,82]],[[70,77],[75,77],[79,83],[85,89],[85,95],[78,95],[75,89],[72,84]]]
		anchors=[Vector2(59,80),Vector2(73,80)]
	for arm in range(2):
		var angle=deg_to_rad(([-12,-5,12,5] if arm==0 else [12,5,-12,-5])[n])
		for y in range(78,100):
			for x in range(40,89):
				var sample=(Vector2(x,y)-anchors[arm]).rotated(-angle)+anchors[arm]
				var sx=int(round(sample.x))
				var sy=int(round(sample.y))
				if sx<0 or sy<0 or sx>=128 or sy>=128 or not inside(sx,sy,arm_polys[arm]):continue
				var c=master.get_pixel(sx,sy)
				if c.a>0.5:limbs.set_pixel(x,y,c)
	var core=api.create_image(128,128)
	var moving=api.create_image(128,128)
	core.blit_rect(canonical,Rect2i(0,0,128,128),Vector2i(0,bob))
	moving.blit_rect(limbs,Rect2i(0,0,128,128),Vector2i(0,bob))
	core.save_png(root+'core-'+d+'-'+str(n+1)+'.png')
	moving.save_png(root+'limbs-'+d+'-'+str(n+1)+'.png')
	var full=moving.duplicate()
	full.blend_rect(core,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.save_png(root+'frame-'+d+'-'+str(n+1)+'.png')
	return core if part=='core' else moving
