G.AddData({
name:'Hot Pepper mod',
author:'Orteil,geekahedron',
desc:'A simple example mod that adds hot peppers and hot sauce, demonstrating hooks with the heritage mod API.',
engineVersion:1,
manifest:'https://rawgit.com/geekahedron/heritage/externalref/hotpepperModManifest.js',
requires:['Default dataset*','Heritage*'],
sheets:{'spicySheet':'img/spicyModIconSheet.png'},//custom stylesheet (note : broken in IE and Edge for the time being)
func:function()
{
	//The idea in this simple example mod is to add a few elements focused around hot sauce, because hot sauce is great and I use that stuff everywhere.

	//First we create a couple new resources :
	new G.Res({
		name:'hot pepper',
		desc:'[hot pepper]s are loaded with capsaicin and, depending on who you ask, may produce a pleasant burn when eaten.',
		icon:[0,0,'spicySheet'],
		turnToByContext:{'eat':{'health':0.01,'happiness':0.03},'decay':{'spoiled food':0.5}},//this basically translates to : "when eaten, generate some health and happiness; when rotting, turn into either nothing or some spoiled food"
		
		// add check for setting to remove completely when disabled
		tick:function(me,tick)
		{
			if (G.checkHSetting('enablehotpepper')=='off')
			{
				var lost=G.lose(me.name,me.amount,'disabled');
				me.visible=false;
			}
		},

		partOf:'food',
		category:'food',
	});
	new G.Res({
		name:'hot sauce',
		desc:'Made from [herb]s and the [hot pepper,Spiciest peppers], this [hot sauce] stays fresh for a while and will leave anyone panting and asking for more.',
		icon:[1,0,'spicySheet'],
		
		// add check for setting to remove completely when disabled
		tick:function(me,tick)
		{
			if (G.checkHSetting('enablehotpepper')=='off')
				var lost=G.lose(me.name,me.amount,'disabled');
				me.visisble=false;
		},

		turnToByContext:{'eat':{'health':0.03,'happiness':0.1},'decay':{'hot sauce':0.95,'spoiled food':0.05}},//that last part makes hot sauce effectively have a 95% chance of simply not rotting (in effect, it decays into itself)
		partOf:'food',
		category:'food',
	});

	//Then we augment the base data to incorporate our new resources :
		//adding a new mode to artisans so they can make hot sauce from hot peppers
	G.getDict('artisan').modes['hot sauce']={
		name:'Make hot sauce',
		desc:'Turn 3 [hot pepper]s and 3 [herb]s into 1 [hot sauce].',
		icon:[1,0,'spicySheet'],
		req:{'hot sauce preparing':true,'enablehotpepper':'on'},	// add dependency on mod setting
		use:{'knapped tools':1}
	};
		//adding a new effect to artisans that handles the actual hot sauce preparing and is only active when the unit has the mode "hot sauce"
	G.getDict('artisan').effects.push({type:'convert',from:{'hot pepper':3,'herb':3},into:{'hot sauce':1},every:3,mode:'hot sauce'});

	//Then we add a new technology which is required by the artisans to gain access to the "hot sauce" mode :
	new G.Tech({
		name:'hot sauce preparing',
		desc:'@[artisan]s can now produce [hot sauce] from [hot pepper]s and [herb]s//This special recipe allows a skilled craftsman to fully express the complex aromas present in hot peppers.',
		icon:[0,1,'spicySheet'],
		cost:{'insight':10},
		req:{'cooking':true,'enablehotpepper':'on'},	// add dependency on mod setting
	});

	//Finally, we add a trait that amplifies the benefits of consuming hot sauce; it will take on average 20 years to appear once the conditions (knowing the "Hot sauce preparing" tech) is fulfilled.
	new G.Trait({
		name:'hot sauce madness',
		desc:'@your people appreciate [hot sauce] twice as much and will be twice as happy from consuming it.',
		icon:[1,1,'spicySheet'],
		chance:20,
		req:{'hot sauce preparing':true,'enablehotpepper':'on'},	// add dependency on mod setting
		effects:[
			{type:'function',func:function(){G.getDict('hot sauce').turnToByContext['eat']['happiness']=0.2;}},//this is a custom function executed when we gain the trait
		],
	});

	//Add hooks to enable and disable the mod elements
	G.callbackEnableHotPepper=function()
	{
		if (G.checkHSetting('enablehotpepper') == "on") {
			G.middleText('- Hot Peppers Enabled -');
			G.getDict('grass').res['gather']['hot pepper']=3;
			// G.getDict('hot pepper').visible=true;
			// G.getDict('hot sauce').visible=true;
		} else {
			G.middleText('- Hot Peppers Disabled -');
			delete G.getDict('grass').res.gather['hot pepper'];
			G.getDict('hot pepper').visible=false;
			G.getDict('hot sauce').visible=false;
			G.removeTrait('hot sauce madness');
			G.removeTech('hot sauce preparing');
			G.convertUnitMode('artisan','hot sauce','knap');
		}
	}

	G.addHSettingCategory({
		displayName:'Hot Pepper mod options',
		desc:'Gameplay options for the example hot pepper mod'
	});

	G.addHSetting({
		name:'enablehotpepper',
		displayName:'Enable hot peppers',
		desc:'Allow the gathering and use of hot peppers',
		icon:[0,0,'spicySheet',22,1],
		effects:{
			'onChange':{func:G.callbackEnableHotPepper}
		}
	});

	//There are many other ways of adding and changing content; refer to /data.js, the default dataset, if you want to see how everything is done in the base game. Good luck!
}
});