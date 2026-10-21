var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v6/'
func run(api,image:Image,project,params:Dictionary):
	var n=int(params.get('frame',0));var kind=str(params.get('kind','outline'))
	var data=JSON.parse_string(FileAccess.get_file_as_string(root+'front-scabbard-straight.json'))
	var bob=int(data.bobY[n])
	var art=Image.load_from_file(root+'before-front-scabbard-straight/'+kind+'-se-'+str(n+1)+'.png')
	for cols in [data.oldColumns,data.columns]:
		for col in cols:
			for y in range(int(col[1])+bob,int(col[2])+bob+1):art.set_pixel(int(col[0]),y,Color.TRANSPARENT)
	if kind=='outline':
		var near=Image.load_from_file(root+'near-se-'+str(n+1)+'.png')
		var standing=Image.load_from_file('C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/idle-se.png')
		for col in data.columns:
			var x=int(col[0]);var top=int(col[1])+bob;var bottom=int(col[2])+bob
			for y in range(top,bottom+1):
				if near.get_pixel(x,y).a>0.5:continue
				var t=float(y-top)/float(bottom-top)
				var c=Color('#352438') if y==top else Color('#463447') if y==bottom else Color('#fffdf9') if t<=0.35 else Color('#efeaf4') if t<=0.57 else Color('#d9d1e2') if t<=0.78 else Color('#9f96ac')
				if str(data.get('mode',''))=='approved-standing-pixels':
					if x>=int(data.referenceStartX):
						c=standing.get_pixel(x,y-bob)
					else:
						c=Color('#463447') if y==top else Color('#55475c') if y==bottom else Color('#fffdf9') if t<=0.4 else Color('#efeaf4') if t<=0.65 else Color('#beb5ca')
				art.set_pixel(x,y,c)
	art.save_png(root+kind+'-se-'+str(n+1)+'.png')
	if kind=='outline':
		var full=Image.load_from_file(root+'legs-se-'+str(n+1)+'.png')
		for layer in ['far','core','near','cap','joint','outline']:full.blend_rect(Image.load_from_file(root+layer+'-se-'+str(n+1)+'.png'),Rect2i(0,0,128,128),Vector2i.ZERO)
		full.save_png(root+'frame-se-'+str(n+1)+'.png')
	for key in [kind,'frame']:
		var sheet=api.create_image(512,128)
		for i in range(4):sheet.blit_rect(Image.load_from_file(root+key+'-se-'+str(i+1)+'.png'),Rect2i(0,0,128,128),Vector2i(i*128,0))
		sheet.save_png(root+key+'-sheet-se.png')
	return art
