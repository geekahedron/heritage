G.AddData({
name:'Cremation',
author:'geekahedron',
desc:'A simple mod that adds corpse cremation.',
engineVersion:1,
manifest:'modManifest.js',
requires:['Default dataset*'],
//sheets:{'cremationSheet':'img/cremationModIconSheet.png'},
sheets:{'cremationSheet':'https://github.com/geekahedron/heritage/blob/master/img/cremationModIconSheet.png?raw=true'},
func:function()
{
	//Create new unit, ash, as a byproduct
	new G.Res({
		name:'ash',
		desc:'[ash] is a byproduct of firemaking activities that can be used in agriculture.',
		icon:[0,0,'cremationSheet'],
		category:'misc',
	});
	
	// Crematorium as a new unit to do the work
	new G.Unit({
		name:'crematorium',
		desc:'@processes goods with fire<>A [crematorium] is an efficient way to dispose of [corpse]s.',//TODO : desc
		icon:[1,0,'cremationSheet'],
		cost:{'basic building materials':50},
		use:{'land':1},
		require:{'worker':1},
		modes:{
			'off':G.MODE_OFF,
			'cremate':{name:'Cremate corpses',icon:[1,0,'cremationSheet'],desc:'Turn 1 [corpse] into [ash] using a [fire pit].',use:{'worker':1},req:{}},
		},
		effects:[
			{type:'convert',from:{'corpse':1,'fire pit':0.01},into:{'ash':1},every:5,mode:'cremate'},
		],
		gizmos:true,
		req:{'fire-making':true},
		category:'civil',
	});
	
	
	//Add technology to unlock cremation mode
	new G.Tech({
		name:'cremation',
		desc:'@[corpse]s can now be burned into [ash].//Cremation can save space and prevent the spread of disease..',
		icon:[0,1,'cremationSheet'],
		cost:{'insight':5},
		req:{'fire-making':true},
	});
}
});
