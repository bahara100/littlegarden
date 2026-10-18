var root='C:/nikke-playground/docs/art/pixel/'

func run(api,image:Image,project,params:Dictionary):
	var out=root+'garden-body-walk-ne-v8/'
	if FileAccess.file_exists(out+'MANUAL_EDIT_LOCK.json'):
		return 'STOP: V8 is manually edited by user. Export the native project; do not regenerate.'
	DirAccess.make_dir_recursive_absolute(out)
	var sheet=api.create_image(384,96)
	var proof=api.create_image(384,96)
	proof.fill(Color('#d5dce1'))
	for n in range(1,5):
		var original=Image.load_from_file(root+'garden-body-walk-ne-v3/frame-'+str(n)+'.png')
		var result=Image.load_from_file(root+'garden-body-walk-ne-v7/frame-'+str(n)+'.png')
		if n==2 or n==4:
			var core=Image.load_from_file(root+'garden-body-walk-ne-v4/core-'+str(n)+'.png')
			var left=Image.load_from_file(root+'garden-body-walk-ne-v4/arms-3.png')
			var right=Image.load_from_file(root+'garden-body-walk-ne-v4/arms-1.png')
			var arm=api.create_image(96,96)
			# Actual drawn forearms and hands: shorten the middle, retain full hand shading.
			# Never scale a hand or replace it with a small geometric stamp.
			for y in range(45,64):
				for side in range(2):
					var is_left=side==0
					var lift=3 if ((n==2 and is_left) or (n==4 and not is_left)) else 5
					var sy=y+mini(lift,maxi(0,y-51))
					var shift=mini(2,maxi(0,y-52))*(1 if is_left else -1)
					for x in range(25 if is_left else 59,44 if is_left else 73):
						# Arm-only donor excludes the vertical shirt outline at its inner edge.
						var sx=x-shift
						if is_left and sx>=40 and sy>=56: continue
						var c=left.get_pixel(sx,sy) if is_left else right.get_pixel(sx,sy)
						if c.a>0.5: arm.set_pixel(x,y,c)
			# Restore the intact original torso; discard the old raised-arm overlap on the right.
			var edges=[56,56,56,57,57,58,58,59,59]
			for y in range(53,62):
				var end=edges[y-53]
				for x in range(55,73):
					var c=Color.TRANSPARENT
					if x<end: c=Color('#bfbbc5')
					if x==end: c=Color('#938a9a')
					if x==end+1: c=Color('#19011e')
					core.set_pixel(x,y,c)
			result=core.duplicate()
			result.blend_rect(arm,Rect2i(0,45,96,23),Vector2i(0,45))
			# Protected pelvis is restored LAST, not deleted by rectangular hand erasers.
			result.blit_rect(original,Rect2i(37,60,25,8),Vector2i(37,60))
			result.blit_rect(original,Rect2i(0,0,96,45),Vector2i.ZERO)
			result.blit_rect(original,Rect2i(0,68,96,28),Vector2i(0,68))
		result.save_png(out+'frame-'+str(n)+'-native.png')
		sheet.blit_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		proof.blend_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
	sheet.save_png(out+'walk.png')
	proof.resize(1536,384,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'arm-review.png')
	return 'V8: restore original pelvis, reuse actual thick shaded forearms and hands'
