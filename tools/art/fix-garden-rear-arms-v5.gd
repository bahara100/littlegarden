var root='C:/nikke-playground/docs/art/pixel/'

func run(api,image:Image,project,params:Dictionary):
	var old=root+'garden-body-walk-ne-v4/'
	var out=root+'garden-body-walk-ne-v5/'
	var sheet=api.create_image(384,96)
	var cores=api.create_image(384,96)
	var arms=api.create_image(384,96)
	var proof=api.create_image(384,96)
	proof.fill(Color('#d5dce1'))
	for n in range(1,5):
		var original=Image.load_from_file(old+'frame-'+str(n)+'.png')
		var core=Image.load_from_file(old+'core-'+str(n)+'.png')
		var arm=Image.load_from_file(old+'arms-'+str(n)+'.png')
		var result=original.duplicate()
		if n==2 or n==4:
			var donor=Image.load_from_file(old+'arms-'+str(1 if n==2 else 3)+'.png')
			arm=api.create_image(96,96)
			# Re-time the existing finished swing drawings into bent passing poses.
			# Shoulder roots stay anchored; retain hand thickness and sleeve shading.
			for y in range(45,65):
				for x in range(25,73):
					var left=x<49
					var bent=(left and n==2) or (not left and n==4)
					var anchor=49 if bent else 52
					var scale_y=1.65 if bent else 1.0
					var sy=y if y<=anchor else anchor+int(round((y-anchor)/scale_y))
					if not bent: sy=y+clampi(y-52,0,3)
					var shift=0
					if y>54:
						shift=mini(1,int(floor((y-54)/4.0)))*(1 if left else -1)
					var c=donor.get_pixel(x-shift,sy)
					if c.a>0.5: arm.set_pixel(x,y,c)
			result=core.duplicate()
			result.blend_rect(arm,Rect2i(0,45,96,23),Vector2i(0,45))
			result.blit_rect(original,Rect2i(0,0,96,45),Vector2i.ZERO)
			result.blit_rect(original,Rect2i(0,68,96,28),Vector2i(0,68))
		result.save_png(out+'frame-'+str(n)+'-native.png')
		arm.save_png(out+'arms-'+str(n)+'.png')
		core.save_png(out+'core-'+str(n)+'.png')
		sheet.blit_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		cores.blit_rect(core,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		arms.blit_rect(arm,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
		proof.blend_rect(result,Rect2i(0,0,96,96),Vector2i((n-1)*96,0))
	sheet.save_png(out+'walk.png')
	cores.save_png(out+'core-sheet.png')
	arms.save_png(out+'arms-sheet.png')
	proof.resize(1536,384,Image.INTERPOLATE_NEAREST)
	proof.save_png(out+'arm-review.png')
	return 'V5 base only: passing arms 2/4; 1/3 unchanged'

