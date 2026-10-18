var root='C:/nikke-playground/docs/art/pixel/'
var palette={'X':Color('#19011e'),'S':Color('#fcc09a'),'s':Color('#fcd8b7'),'h':Color('#fde4c7')}

func hand(dst:Image,x0:int,y0:int,flip:bool):
	# Rounded mitten silhouette, comparable in volume to the unchanged swing hands.
	var rows=["   XXX   "," XXSSsXX "," XShhhssX","XSSshhssX","XSSsssssX"," XSSsssX ","  XSSsX  ","   XXX   "]
	for y in range(rows.size()):
		for x in range(9):
			var k=rows[y][8-x if flip else x]
			if palette.has(k): dst.set_pixel(x0+x,y0+y,palette[k])

func run(api,image:Image,project,params:Dictionary):
	var out=root+'garden-body-walk-ne-v7/'
	DirAccess.make_dir_recursive_absolute(out)
	var sheet=api.create_image(384,96)
	var proof=api.create_image(384,96)
	proof.fill(Color('#d5dce1'))
	for n in range(1,5):
		var src=Image.load_from_file(root+'garden-body-walk-ne-v6/frame-'+str(n)+'.png')
		if n==2 or n==4:
			var ly=55 if n==2 else 53
			var ry=53 if n==2 else 55
			# Replace only the small hand silhouettes; wrist and sleeve roots stay fixed.
			for y in range(ly,64):
				for x in range(31,41): src.set_pixel(x,y,Color.TRANSPARENT)
			for y in range(ry,64):
				for x in range(61,72): src.set_pixel(x,y,Color.TRANSPARENT)
			hand(src,32,ly,false)
			hand(src,61,ry,true)
		src.save_png(out+'frame-'+str(n)+'-native.png')
		sheet.blit_rect(src,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		proof.blend_rect(src,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
	sheet.save_png(out+'walk.png')
	proof.resize(1536,384,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'hand-review.png')
	return 'V7: restore hand volume only, frame 1/3 unchanged'
