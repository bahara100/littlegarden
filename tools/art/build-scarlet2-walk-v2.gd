var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v2/'
var previous='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v1/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'))
	var n=int(params.get('frame',0))
	var part=str(params.get('part','body'))
	var bob=-1 if n%2==1 else 0
	var head=api.create_image(128,128)
	head.blit_rect(Image.load_from_file(standing+'head-'+d+'.png'),Rect2i(0,0,128,128),Vector2i(0,bob))
	if part=='head':
		head.save_png(root+'head-'+d+'-'+str(n+1)+'.png')
		return head
	# These are measured BODICE centres, not whole-sprite bounding-box centres.
	# Hands and scabbard must not affect the neck alignment.
	# The approved rear head's nape is at x66; the front head's neck is at x62.
	var shift=[-3,3,-1,2] if d=='se' else [2,5,1,5]
	var src_waist=[89,86,86,85] if d=='se' else [86,85,85,84]
	var target_waist=(88 if d=='se' else 85)+bob
	var source_neck=76+bob
	var target_neck=76+bob
	var bottom=[114,111,114,113][n]
	var source=Image.load_from_file(previous+'body-'+d+'-'+str(n+1)+'.png')
	var body=api.create_image(128,128)
	for y in range(77+bob,bottom+1):
		var sy:int
		if y<=target_waist:
			sy=int(round(source_neck+float(y-target_neck)*float(src_waist[n]-source_neck)/float(target_waist-target_neck)))
		else:
			sy=int(round(src_waist[n]+float(y-target_waist)*float(bottom-src_waist[n])/float(bottom-target_waist)))
		for x in range(128):
			var sx=x-shift[n]
			if sx<0 or sx>=128:continue
			body.set_pixel(x,y,source.get_pixel(sx,sy))
	body.save_png(root+'body-'+d+'-'+str(n+1)+'.png')
	var full=body.duplicate()
	full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.save_png(root+'frame-'+d+'-'+str(n+1)+'.png')
	return body
