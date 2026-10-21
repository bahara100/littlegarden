var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v6/'
func run(api,image:Image,project,params:Dictionary):
	var d=str(params.get('dir','se'));var n=int(params.get('frame',0))
	if d=='se' and FileAccess.file_exists(root+'front-scabbard-straight.json'):return Image.load_from_file(root+'outline-se-'+str(n+1)+'.png')
	var data=JSON.parse_string(FileAccess.get_file_as_string(root+'scabbard-line.json'))
	var base=Image.load_from_file(root+'before-scabbard-outline/frame-'+d+'-'+str(n+1)+'.png')
	var near=Image.load_from_file(root+'near-'+d+'-'+str(n+1)+'.png')
	var far=Image.load_from_file(root+'far-'+d+'-'+str(n+1)+'.png')
	var core=Image.load_from_file(root+'core-'+d+'-'+str(n+1)+'.png')
	var ink=api.create_image(128,128)
	var bob=int(data.bobY[n]);var count=0
	for col in data.columns[d]:
		var x=int(col[0]);var top=int(col[1])+bob;var bottom=int(col[2])+bob
		for y in range(top,bottom+1):
			if base.get_pixel(x,y).a<0.5:continue
			# Front arm is above torso; a far arm only shows where core is empty.
			if near.get_pixel(x,y).a>0.5:continue
			if far.get_pixel(x,y).a>0.5 and core.get_pixel(x,y).a<0.5:continue
			var t=float(y-top)/max(bottom-top,1)
			var c=Color('#352438') if y==top else Color('#463447') if y==bottom else Color('#fffdf9') if t<=0.35 else Color('#efeaf4') if t<=0.57 else Color('#d9d1e2') if t<=0.78 else Color('#9f96ac')
			ink.set_pixel(x,y,c);count+=1
	ink.save_png(root+'outline-'+d+'-'+str(n+1)+'.png')
	base.blend_rect(ink,Rect2i(0,0,128,128),Vector2i.ZERO)
	base.save_png(root+'frame-'+d+'-'+str(n+1)+'.png')
	var full_sheet=api.create_image(512,128);var line_sheet=api.create_image(512,128)
	for i in range(4):
		var fp=root+'frame-'+d+'-'+str(i+1)+'.png';var lp=root+'outline-'+d+'-'+str(i+1)+'.png'
		if FileAccess.file_exists(fp):full_sheet.blit_rect(Image.load_from_file(fp),Rect2i(0,0,128,128),Vector2i(i*128,0))
		if FileAccess.file_exists(lp):line_sheet.blit_rect(Image.load_from_file(lp),Rect2i(0,0,128,128),Vector2i(i*128,0))
	full_sheet.save_png(root+'frame-sheet-'+d+'.png');line_sheet.save_png(root+'outline-sheet-'+d+'.png')
	return ink
