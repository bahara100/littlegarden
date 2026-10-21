var root='C:/nikke-playground/docs/art/pixel/scarlet2-walk-v1/'
var standing='C:/nikke-playground/docs/art/pixel/scarlet2-base-v2/'
func patch_boot(body:Image,origin:Vector2i,rows:Array):
	var ink={'W':'#fffdf9','H':'#efeaf4','s':'#9f96ac','D':'#4c465c','g':'#c49c55'}
	for j in range(rows.size()):
		for i in range(rows[j].length()):
			var v=rows[j][i]
			if v=='.':continue
			var x=origin.x+i
			var y=origin.y+j
			var c=body.get_pixel(x,y)
			if c.a>0.7 and max(c.r,max(c.g,c.b))>0.45:
				body.set_pixel(x,y,Color(ink[v]))

func boot_materials(body:Image,dir:String,n:int):
	# Explicit per-pose material ownership, rather than a left/right-screen colour rule.
	# SE1/2 left boot is forward/supporting; SE3/4 right boot is forward/supporting.
	if dir=='se' and n==0:
		patch_boot(body,Vector2i(52,100),['sHHHH','HHWWW','HWWWW','sHHHW','..ggg'])
		patch_boot(body,Vector2i(70,104),['sHHHs','HHWWW','ssHHs','HWWWH','sHHHs','HHWWW','.sHHH'])
	elif dir=='se' and n==1:
		patch_boot(body,Vector2i(59,102),['sHHHs','HWWWH','ssHHs','HHWWW','sHHHs','HWWWH'])
	elif dir=='ne' and n==0:
		patch_boot(body,Vector2i(67,100),['sHHW','HWWW','HHWW'])
	elif dir=='ne' and n==2:
		patch_boot(body,Vector2i(49,101),['sHHW','HHWW'])
		patch_boot(body,Vector2i(67,99),['sHHs','HWWW','ssHH','HWWW'])
	elif dir=='ne' and n==3:
		patch_boot(body,Vector2i(56,106),['sHHHs','HHWWW','ssHHs','HWWWH'])

func run(api,image:Image,project,params:Dictionary):
	var dir=str(params.get('dir','se'))
	var n=int(params.get('frame',0))
	var part=str(params.get('part','body'))
	var head=api.create_image(128,128)
	var bob=-1 if n%2==1 else 0
	head.blit_rect(Image.load_from_file(standing+'head-'+dir+'.png'),Rect2i(0,0,128,128),Vector2i(0,bob))
	if part=='head':
		head.save_png(root+'head-'+dir+'-'+str(n+1)+'.png')
		return head
	var src=Image.load_from_file(root+'source-ai-'+dir+'.png')
	var cell=src.get_region(Rect2i((n%2)*627,int(n/2)*627,627,627))
	var configs=[[355,355,603,0.20],[355,355,603,0.20],[355,378,589,0.20],[355,383,591,0.20]] if dir=='se' else [[348,380,590,0.22],[350,380,584,0.22],[349,373,560,0.22],[350,378,565,0.22]]
	var cfg=configs[n]
	if dir=='se' and n==0:
		cell=Image.load_from_file(root+'source-se-contact-1.png')
		cfg=[620,740,1158,0.10]
	var target_neck=76+bob
	var bottom=[114,111,114,113][n]
	var sy=float(cfg[2]-cfg[1]+1)/float(bottom-target_neck+1)
	var body=api.create_image(128,128)
	var palette=[]
	for v in JSON.parse_string(FileAccess.get_file_as_string(root+'palette.json')):palette.append(Color(v))
	var cache={}
	for y in range(77+bob,bottom+1):
		for x in range(128):
			var px=int(float(x-62)/cfg[3]+cfg[0])
			var py=int((float(y-target_neck)+0.5)*sy+cfg[1])
			if px<0 or py<0 or px>=cell.get_width() or py>=cell.get_height():continue
			var c=cell.get_pixel(px,py)
			if c.a<0.7:continue
			var k=c.to_rgba32()
			if not cache.has(k):
				var best=palette[0]
				var score=99.0
				for p in palette:
					var dist=pow(c.r-p.r,2)+pow(c.g-p.g,2)+pow(c.b-p.b,2)
					if dist<score:
						score=dist
						best=p
				cache[k]=best
			body.set_pixel(x,y,cache[k])
	boot_materials(body,dir,n)
	body.save_png(root+'body-'+dir+'-'+str(n+1)+'.png')
	var full=body.duplicate()
	full.blend_rect(head,Rect2i(0,0,128,128),Vector2i.ZERO)
	full.save_png(root+'frame-'+dir+'-'+str(n+1)+'.png')
	return body
