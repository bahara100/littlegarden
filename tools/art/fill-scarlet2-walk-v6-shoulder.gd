var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v6/'
func run(api,image:Image,project,params:Dictionary):
	var n=int(params.get('frame',0))
	var d=str(params.get('dir','se'))
	# The front contour is now authored by the dedicated straightening pass.
	if d=='se' and FileAccess.file_exists(root+'front-scabbard-straight.json'):return Image.load_from_file(root+'joint-se-'+str(n+1)+'.png')
	var filename='rear-shoulder-fill.json' if d=='ne' else 'shoulder-fill.json'
	var patches=JSON.parse_string(FileAccess.get_file_as_string(root+filename))
	var seam=api.create_image(128,128)
	for p in patches.frames[str(n+1)]:seam.set_pixel(int(p.x),int(p.y),Color(p.color))
	seam.save_png(root+'joint-'+d+'-'+str(n+1)+'.png')
	var full=Image.load_from_file(root+'before-shoulder-fill/frame-'+d+'-'+str(n+1)+'.png')
	full.blend_rect(seam,Rect2i(0,0,128,128),Vector2i.ZERO)
	var linefile=root+'outline-'+d+'-'+str(n+1)+'.png'
	if FileAccess.file_exists(linefile):full.blend_rect(Image.load_from_file(linefile),Rect2i(0,0,128,128),Vector2i.ZERO)
	full.save_png(root+'frame-'+d+'-'+str(n+1)+'.png')
	var sheet=api.create_image(512,128)
	var joint_sheet=api.create_image(512,128)
	for i in range(4):
		var frame_path=root+'frame-'+d+'-'+str(i+1)+'.png'
		var joint_path=root+'joint-'+d+'-'+str(i+1)+'.png'
		if FileAccess.file_exists(frame_path):sheet.blit_rect(Image.load_from_file(frame_path),Rect2i(0,0,128,128),Vector2i(i*128,0))
		if FileAccess.file_exists(joint_path):joint_sheet.blit_rect(Image.load_from_file(joint_path),Rect2i(0,0,128,128),Vector2i(i*128,0))
	sheet.save_png(root+'frame-sheet-'+d+'.png')
	joint_sheet.save_png(root+'joint-sheet-'+d+'.png')
	return seam
