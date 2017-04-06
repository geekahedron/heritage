G.AddData({
name:'Cremation',
author:'geekahedron',
desc:'A simple mod that adds corpse cremation.',
engineVersion:1,
manifest:'modManifest.js',
requires:['Default dataset*'],
//sheets:{'creamtionSheet':'img/cremationModIconSheet.png'},//custom stylesheet (note : broken in IE and Edge for the time being)
sheets:{'creamtionSheet':'https://github.com/geekahedron/heritage/blob/master/img/cremationModIconSheet.png?raw=true'},//custom stylesheet (note : broken in IE and Edge for the time being)
func:function()
{
	//First we create a couple new resources :
	new G.Res({
		name:'ash',
		desc:'[ash] is a byproduct of firemaking activities that can be used in agriculture.',
		icon:[0,0,'cremationSheet'],
		category:'misc',
	});
	
	new G.Unit({
		name:'crematorium',
		desc:'@processes goods with fire<>A [crematorium] is an efficient way to dispose of .',//TODO : desc
		icon:[1,0,cremationSheet],
		cost:{'basic building materials':50},
		use:{'land':1},
		//require:{'worker':1,'fire pit':1},
		//upkeep:{'stick':3},//TODO : some fuel system
		modes:{
			'off':G.MODE_OFF,
			'cremate':{name:'Cremate corpses',icon:[1,0,'cremationSheet'],desc:'Turn 1 [corpse] into [ash].',use:{'worker':1},req:{}},
		},
		effects:[
			{type:'convert',from:{'corpse':1},into:{'ash':1},every:5,mode:'cremate'},
		],
		gizmos:true,
		req:{'fire-making':true},
		category:'civil',
	});
	
	
	//Then we add a new technology which is required by the artisans to gain access to the "hot sauce" mode :
	new G.Tech({
		name:'cremation',
		desc:'@[corpse]s can now be burned into [ash].//Cremation can save space and prevent the spread of disease..',
		icon:[0,1,'cremationSheet'],
		cost:{'insight':10},
		req:{'fire-making':true},
	});
}
});
