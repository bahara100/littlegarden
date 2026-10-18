var root='C:/nikke-playground/docs/art/pixel/'
var colours={'X':Color('#19011e'),'o':Color('#3d173b'),'S':Color('#fcc09a'),'s':Color('#fcd8b7'),'h':Color('#fde4c7'),'g':Color('#bebac4'),'d':Color('#938a9a')}

func stamp(dst:Image,rows:Array,x0:int,y0:int):
	for y in range(rows.size()):
		for x in range(rows[y].length()):
			var key=rows[y][x]
			if colours.has(key): dst.set_pixel(x0+x,y0+y,colours[key])

func run(api,image:Image,project,params:Dictionary):
	var out=root+'garden-body-walk-ne-v6/'
	DirAccess.make_dir_recursive_absolute(out)
	var sheet=api.create_image(384,96)
	var arm_sheet=api.create_image(384,96)
	var proof=api.create_image(384,96)
	proof.fill(Color('#d5dce1'))
	for n in range(1,5):
		var src=Image.load_from_file(root+'garden-body-walk-ne-v5/frame-'+str(n)+'.png')
		var result=src.duplicate()
		var arm=api.create_image(96,96)
		if n==2 or n==4:
			var core=Image.load_from_file(root+'garden-body-walk-ne-v4/core-'+str(n)+'.png')
			# The old arm cut left skin dots and a doubled ink loop in the right armpit.
			# Reconstruct the shirt edge before adding the new arm, without resampling.
			var edge=[56,56,56,57,57,58,58,59,59]
			for y in range(53,62):
				var stop=edge[y-53]
				for x in range(55,70):
					var c=Color.TRANSPARENT
					if x<stop: c=Color('#bfbbc5')
					if x==stop: c=Color('#938a9a')
					if x==stop+1: c=Color('#19011e')
					core.set_pixel(x,y,c)
			var left=Image.load_from_file(root+'garden-body-walk-ne-v4/arms-3.png')
			var right=Image.load_from_file(root+'garden-body-walk-ne-v4/arms-1.png')
			# Keep the original shoulder/sleeve roots, then draw compact passing arms.
			for y in range(45,51):
				for x in range(30,72):
					var c=left.get_pixel(x,y) if x<49 else right.get_pixel(x,y)
					if c.a>0.5: arm.set_pixel(x,y,c)
			if n==2:
				stamp(arm,["     XggggX","    XdggggX","    XSssgX ","   XSsssX  ","  XSssssX  ","  XShhssX  ","  XShhssX  ","   XsssX   ","    XssX   ","     XX    "],32,51)
				stamp(arm,["XggggX    ","XdgggsX   "," XgSsssX  ","  XSssssX ","   XSshhsX","   XSshhsX","    XsssX ","     XXX  "],58,51)
			else:
				stamp(arm,["     XggggX","    XdggggX","   XSSssgX ","  XSssssX  ","  XShhssX  ","  XShhssX  ","   XsssX   ","    XXX    "],32,51)
				stamp(arm,["XggggX    ","XdgggsX   "," XgSsssX  ","  XSssssX ","   XSssssX","   XSshhsX","   XSshhsX","    XsssX ","     XssX ","      XX  "],58,51)
			result=core.duplicate()
			result.blend_rect(arm,Rect2i(0,45,96,23),Vector2i(0,45))
			result.blit_rect(src,Rect2i(0,0,96,45),Vector2i.ZERO)
			result.blit_rect(src,Rect2i(0,68,96,28),Vector2i(0,68))
		result.save_png(out+'frame-'+str(n)+'-native.png')
		arm.save_png(out+'arms-'+str(n)+'.png')
		sheet.blit_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		arm_sheet.blit_rect(arm,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		proof.blend_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
	sheet.save_png(out+'walk.png')
	arm_sheet.save_png(out+'arms-sheet.png')
	proof.resize(1536,384,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'arm-review.png')
	return 'V6: hand-authored compact passing arms; no vertical stretch'
