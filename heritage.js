G.AddData({
name:'NeverEnding Heritage Mod',
author:'geekahedron',
desc:'A collection of mods and improvements for NeverEnding Legacy.',
engineVersion:1,
manifest:'https://rawgit.com/geekahedron/heritage/master/heritageModManifest.js',
requires:['Default dataset*'],
sheets:{
	'heritageSheet':'https://rawgit.com/geekahedron/heritage/master/img/heritageModIconSheet.png',
	'expandSheet':'https://rawgit.com/geekahedron/heritage/master/img/expandModIconSheet.png',
},
func:function()
{
/************************************************
 *             HERITAGE SETTINGS                *
 ************************************************
 *
 * Use hidden in-game policies as 'settings' for this mod.
 * We could use actual settings, but the main codebase says mods should not do that (no explanation as to why not -- it works fine -- but hey).
 * Also, settings are not part of the "checkReq" list, only policies, traits, techs, and units, so we want to do it this way anyway.
 *
 */	

// For starters, basically wraps/mimics the default policy definition, with a few additions
	G.hSetting=[];
	G.hSettingByName=[];
	G.hSettingCategory=[];

	G.HSetting=function(obj)
	{
		this.type='policy';	// required to work with G.checkReq()
		this.category='debug';	// best way to keep them hidden for now
		this.family='';
		this.startWith=0;
		this.icon=[0,0];
		this.modes=[];
		this.mode=0;
		this.req={};
		this.visible=false;

		for (var i in obj) this[i]=obj[i];
		this.id=G.policy.length;
		if (!this.displayName) this.displayName=cap(this.name);
		if(!this.hcategory) this.hcategory='hidden';
		G.policy.push(this);
		G.policyByName[this.name]=this;
		G.setDict(this.name,this);
		if (this.modes.length==0)
		{
			//no modes defined? auto-populate as simple on/off switch
			this.modes['off']={name:'Disabled',desc:'This policy is disabled.'};
			this.modes['on']={name:'Enabled',desc:'This policy is enabled.'};
			if (this.effectsOff) this.modes['off'].effects=this.effectsOff;
			if (this.effects) this.modes['on'].effects=this.effects;
			this.binary=true;
		}
		this.mod=G.context;
		
		// extra stuff here
		G.hSetting.push(this);
		G.hSettingByName[this.name]=this;
	}

	G.baseHSetting=function(obj)
	{
		this.type='setting';
		for (var i in obj) this[i]=obj[i];
		G.hSetting.push(this);
		G.hSettingByName[this.name]=this;
	}

	G.getHSetting=function(name) {
		if (!G.hSettingByName[name])
			ERROR('No policy exists with the name '+name+'.');
		else
			return G.hSettingByName[name];
	}

	G.checkHSetting=function(name)
	{
		var me=G.getHSetting(name);
//		if (!me.visible) return 0;
		return me.mode.id;
	}

	G.setHSettingModeByName=function(name,mode)
	{
		me=G.getHSetting(name);
		G.setHSettingMode(me,me.modes[mode]);
	}

	G.setHSettingMode=function(me,mode)
	{
		//free old mode uses, and assign new mode uses
		var oldMode=me.mode;
		var newMode=mode;
		if (oldMode!=newMode)
		{
			me.mode=mode;

			if (me.mode.effects) G.applyKnowEffects(me.mode,false,true);
			
			if (me.l != 0)	// only update visuals for displayed policy buttons
			{
				if (G.getSetting('animations')) triggerAnim(me.l,'plop');
				if (me.binary)
				{
					if (mode.id=='off') me.l.classList.add('off');
					else me.l.classList.remove('off');
				}
			}

			// function callback specifically for HSettings
			if (me.effects.onChange) me.effects.onChange.func();
		}
	}

	// functions to create the interface buttons for these settings
	G.writeHSettingButton=function(obj)
	{
		G.pushCallback(function(obj){return function(){
			var div=l('hsettingButton-'+obj.id);
			if (div)
			{
				var me=G.getHSetting(obj.name);
				if (me.binary==true)
				{
					var on = (G.checkHSetting(obj.name)=="on");

					div.innerHTML=obj.text||me.name;
					if (on) div.classList.add('on');
				}

				div.onclick=function(div,name,value,siblings){return function(){G.clickHSettingButton(div,name,value,siblings);}}(div,obj.name,obj.value,obj.siblings);
				if (obj.tooltip) G.addTooltip(div,function(str){return function(){return str;};}(obj.tooltip),{offY:-8});
			}
		}}(obj));
		return '<div class="button" id="hsettingButton-'+obj.id+'"></div>';
	}

	G.clickHSettingButton=function(div,name,value,siblings)
	{
		var me=G.getHSetting(name);

		if (me.binary)
		{
			if (G.checkHSetting(name)=="on")
			{
				G.setHSettingMode(me,me.modes["off"]);
			}
			else{
				G.setHSettingMode(me,me.modes["on"]);
			}
		}
		else
		{
			G.setHSettingMode(me,me.modes[value]);
		}

		if (div)
		{
			var on=(me.mode.id=="on");
			if (on) div.classList.add('on'); else div.classList.remove('on');
			if (siblings)
			{
				for (var i in siblings)
				{
					if (('hsettingButton-'+siblings[i])!=div.id)
					{l('hsettingButton-'+siblings[i]).classList.remove('on');}
				}
			}
		}
	}

	// add and manage categories of settings for automation population
	G.addHSettingCategory=function(obj)
	{
		// make sure the category doesn't exist
		if (G.hSettingCategory['obj.id']===undefined)
		{
			G.hSettingCategory[obj.id]=obj;
		}
	}
	
	G.updateHSettingCategory=function(obj)
	{
		// make sure the category exists
		if (G.hSettingCategory['obj.id']!==undefined)
		{
			for (var i in obj)
			{
				G.hSettingCategory['obj.id'][i] = obj[i];
			}
		} else {
			console.error('No such hSetting category: ',obj.id);
		}
	}

	// finally, a function to write each category of settings and buttons
	G.writeHSettingCategories=function()
	{
		var str='';
		for (c in G.hSettingCategory)
		{
			if (c=='hidden') continue;
			var category=G.hSettingCategory[c];
			str+='<div class="barred fancyText">'+category.displayName+'</div>';
			for (var i in G.hSetting)
			{
				var s = G.hSetting[i];
				if (s.hcategory == c)
				{
					if (s.type=='setting')
					{
						str+=G.writeSettingButton({
							id:s.id,
							name:s.name,
							text:s.displayName,
							tooltip:s.desc
						});
					} else {
						str+=G.writeHSettingButton({
							id:s.name,
							name:s.name,
							text:s.displayName,
							tooltip:s.desc,
						});
					}
				}
			}
			str+='<br /><br />';
		}
		return str;
	}

// add initial category for heritage mod settings
	G.addHSettingCategory({
		id:'heritage',
		name:'heritage',
		displayName:'Heritage modpack options',
		desc:'Gameplay options from the Heritage modpack'
	});

	G.addHSettingCategory({
		id:'display',
		name:'display',
		displayName:'Display options',
	});

	G.baseHSetting({
		hcategory:'display',
		id:'tiereddisplay',
		name:'tieredDisplay',
		displayName:'Enable research tiers',
		desc:'Turn on display of available research, arranged in tiers by cost.'
	});
/************************************************
 *              FIRE MAKING TWEAKS              *
 ************************************************
 * 
 * Improved methods of making fires and keeping the populous warm
 */	
// add log-burning mode to firekeepers
	G.getDict('firekeeper').modes['log fires']={
		name:'Start fires from logs',
		desc:'Craft [fire pit]s from 1 [log]s each.',
		icon:[1,6,13,7],
		req:{'fire-making':true,'woodcutting':true,'enablelogfires':'on'},
	};
	G.getDict('firekeeper').effects.push({
		type:'convert',from:{'log':1},into:{'fire pit':1},every:5,mode:'log fires'
	});

// callback function to effect changes when setting is toggled
	G.callbackEnableLogFires=function()
	{
		if (G.checkHSetting('enablelogfires') == "on") {
			G.middleText('- Log Fires Enabled -');
		}
		else {
			G.middleText('- Log Fires Disabled -');

			// change mode on existing firekeepers from log fires to stick fires
			G.convertUnitMode('firekeeper','log fires','stick fires');
		}
	}

// setting to enable the log fires
	new G.HSetting({
		hcategory:'heritage',
		name:'enablelogfires',
		displayName:'Enable Log Fires',
		desc:'Allow the burning of logs for more effiecient fires.',
		icon:[16,2,1,6,13,7],
		cost:{},
		startsWith:true,
		visible:false,
		binary: true,
		effects:{
			'onChange':{func:G.callbackEnableLogFires}
		},
	});

/************************************************
 *               CREMATION v0.1                 *
 ************************************************
 * 
 * Another way to get rid of bodies, using fire!
 */

	// function callback to make changes and clean up when the option is changed
	G.callbackEnableCremation=function()
	{
		if (G.checkHSetting('enablecremation') == "on") {
			G.middleText('- Cremation Enabled -');
		}
		else {
			G.middleText('- Cremation Disabled -');
	// remove tech
			for (i in G.techsOwned) {
				if (G.techsOwned[i].tech.name == 'cremation') {
					G.techsOwned.splice(i,1);
					G.techsOwnedNames.splice(i,1);
					G.applyKnowEffects(G.getDict('cremation'),true,true);
					G.update['tech']();
					break;
				}
			}

			// change mode on existing firekeepers from cremate to default
			G.convertUnitMode('firekeeper','cremate','stick fires');
		}
	};

	new G.Res({
		name:'urn',
		desc:'A [pot] filled with the ashes of a loved one from [cremation].//May slowly boost [faith] when kept.',
		icon:[11,7,13,5],
		tick:function(me,tick) {
			var changed = me.amount*0.01;
			G.pseudoGather(G.getRes('faith'),randomFloor(changed));
			var toBreak=me.amount*0.001;
			var spent=G.lose(me.name,randomFloor(toBreak),'breaking');
		},
		category:'misc',
	});

// Add new research to unlock cremation	
	new G.Tech({
		name:'cremation',
		desc:'@Corpses can be ritually burned to promote health and spirituality.',
		icon:[0,1,'heritageSheet'],
		cost:{'insight':10},
		req:{'fire-making':true,'ritualism':true,'pottery':true,'enablecremation':true},
		// req:{'tribalism':true,'enablecremation':true},	// easier to debug with minimal requirements
		effects:[
		],
	});

// Add cremate mode to firekeepers with the required effect
	G.getDict('firekeeper').modes['cremate']={
		name:'cremate',
		desc:'Burn 1 [corpse] with [fire pit,fire] on a pyre of 10 [log]s, and put the ashes into a [pot] to make an [urn]',
		icon:[16,2,8,3,13,7],
		req:{'cremation':true,'enablecremation':true}
	};
	G.getDict('firekeeper').effects.push({
		type:'convert',from:{'corpse':1,'pot':1,'log':30,'fire pit':0.5},into:{'urn':1},every:10,mode:'cremate'
	});

// Add setting to turn the whole thing on or off
	new G.HSetting({
		hcategory:'heritage',
		name:'enablecremation',
		displayName:'Enable Cremation',
		desc:'Enable the appearance of creation tech and abilities.',
		icon:[16,2,8,3,13,7],
		cost:{},
		startsWith:true,
		visible:false,
		binary: true,
		effects:{
			'onChange':{func:G.callbackEnableCremation}
		},
	});

/************************************************
 *               Bread-Baking v0.1              *
 ************************************************
 * 
 * Gatherers can find grain and firekeepers can turn it into bread (its a bit more complicated than that)
 */
//Note: This is taken from my mod, I have edited it a bit so it would work, but I'm not sure.	
	
		new G.Res({
		name:'Grain',
		desc:'[Grain] tastes unpleasant but can be used for many things. You can grind wheat into flour.',
		//icon:[1,3,'imageSheet'], //TODO: Image for wheat
		turnToByContext:{'eat':{'health':-10,'happiness':-100},'decay':{'spoiled food':0.3,'Grain':0.7}},
		partOf:'food',
		category:'food',
	});
	
	G.getDict('grass').res['gather']['Grain']=0.05;
	G.getDict('artisan').effects.push({type:'convert',from:{'Grain':1},into:{'Flour':2},every:5,mode:'GrindGrain'});
	G.getDict('artisan').modes['GrindGrain']={name:'Grind Grain into Flour',desc:'Use Grain to make Flour',req:{'Grinding':true},use:{'stone tools':1}};
	
	
		new G.Res({
		name:'Flour',
		desc:'You can bake [Flour] to make [Wheat Bread].',
		//icon:[2,3,'imageSheet'], //TODO: Image for wheat
		turnToByContext:{'eat':{'health':-30,'happiness':-100},'decay':{'spoiled food':0.2}},
		partOf:'food',
		category:'food',
	});
	
		new G.Res({
		name:'Bread',
		desc:'[Bread] tastes really good.',
		//icon:[0,3,'imageSheet'], //TODO: Image for wheat
		turnToByContext:{'eat':{'health':3,'happiness':20},'decay':{'spoiled food':0.3,}},
		partOf:'food',
		category:'food',
	});
	
	G.getDict('firekeeper').modes['Bread']={name:'Make Bread',desc:'Use Flour to make Bread.',req:{'Bread Baking':true},use:{'stone tools':1}};
	G.getDict('firekeeper').effects.push({type:'convert',from:{'Flour':1},into:{'Bread':1},every:5,mode:'Bread'});
	
		new G.Tech({
		name:'Grinding',
		desc:'Unlocks the secrets of grinding grain into flour.',
		//icon:[3,1,'imageSheet'],
		cost:{'insight':15},
		req:{'sedentism':true},
	});
		new G.Tech({
		name:'Bread Baking',
		desc:'Unlocks the secrets of baking bread.',
		//icon:[3,0,'imageSheet'],
		cost:{'insight':20},
		req:{'Grinding':true, 'fire-making':true},
	});
		
	
	//I copied your button thingy. It may or may not work.
	
	// callback function to effect changes when setting is toggled
	G.callbackEnableBread=function()
	{
		if (G.checkHSetting('enablebread') == "on") {
			G.middleText('- Bread Baking Enabled -');
		}
		else {
			G.middleText('- Bread Baking Disabled -');

			// change mode on existing firekeepers from log fires to stick fires
			//G.convertUnitMode('firekeeper','log fires','stick fires');
			// remove tech
			for (i in G.techsOwned) {
				if (G.techsOwned[i].tech.name == 'Grinding') {
					G.techsOwned.splice(i,1);
					G.techsOwnedNames.splice(i,1);
					G.applyKnowEffects(G.getDict('Grinding'),true,true);
					G.update['tech']();
					break;
				}
			}
			// remove tech
			for (i in G.techsOwned) {
				if (G.techsOwned[i].tech.name == 'Bread Baking') {
					G.techsOwned.splice(i,1);
					G.techsOwnedNames.splice(i,1);
					G.applyKnowEffects(G.getDict('Bread Baking'),true,true);
					G.update['tech']();
					break;
				}
			}

		}
	}

// setting to enable the log fires
	new G.HSetting({
		hcategory:'heritage',
		name:'enablebread',
		displayName:'Enable Bread Baking',
		desc:'Allow the grinding of grain, and baking of bread to provide food for your people.',
		//icon:[16,2,1,6,13,7],
		cost:{},
		startsWith:true,
		visible:false,
		binary: true,
		effects:{
			'onChange':{func:G.callbackEnableBread}
		},
	});

	
	
	
	
/************************************************
 *            HERITAGE OPTIONS TAB              *
 ************************************************
 *
 * Add a tab to the GUI for options and information specific to this mod.
 *
 */

	// only add the tab once per page load (otherwise tab will duplicate with new game or mod reloading)
	var addTab = true;
	for (t in G.tabs) {
		if (G.tabs[t].name=='Heritage')
			addTab = false;
	}

	if (addTab)
	{
		G.tabs.push({
			name:'Heritage',
			id:'heritage',
			popup:true,
			addClass:'right',
			desc:'Options and information about the Heritage mod pack.'
		});
		// Don't make assumptions about the existing tabs
		// (or another mod that does the same thing)
		// make sure everything is numbered and built properly
		for (var i=0;i<G.tabs.length;i++){G.tabs[i].I=i;}
		G.buildTabs();
	}

	G.tabPopup['heritage']=function()
	{
		var str='';
		
		// disclaimer blurb for the top
		str+='<div class="par">'+
		'<b>NeverEnding Heritage</b> is a modpack for NeverEnding Legacy by <a href="https://github.com/geekahedron/heritage" target="_blank">geekahedron</a>.'+
		'It is currently in early alpha, may feature strange and exotic bugs, and may be updated at any time.</div>'+
		'<div class="par">While in development, the modpack may be unstable and subject to changes, but the overall goal is to '+
		'expand and improve the legacy with flexible, balanced, user-created content and improvements to existing mechanics.</div>'+

		'<div class="fancyText title">Heritage Modpack</div>'+
/*
		// add buttons for mod-specific settings
		'<div class="barred fancyText">Modpack options</div>'+
		G.writeHSettingButton({
			id:'enablecremation',
			name:'enablecremation',
			text:'Enable Cremation technology',
			tooltip:'Turn on the ability for your society to discover cremation technology.'
		})+
		G.writeHSettingButton({
			id:'enablelogfires',
			name:'enablelogfires',
			text:'Enable log fires',
			tooltip:'Turn on the ability to burn logs as well as sticks to create fire.'
		})+
		'<br /><br />'+

		// add buttons for hidden base game settings
		'<div class="barred fancyText">Display options</div>'+
		G.writeHSettingButton({
			id:'separateunits',
			name:'separateunits',
			text:'Separate unit categories',
			tooltip:'Always display unit categories on separate lines on the production screen.'
		})+
		G.writeSettingButton({
			id:'tiereddisplay',
			name:'tieredDisplay',
			text:'Enable research tiers',
			tooltip:'Turn on display of available research, arranged in tiers by cost.'
		})+
*/
		G.writeHSettingCategories()+
		'<div class="divider"></div>'+
		'<div class="buttonBox">'+
		G.dialogue.getCloseButton()+
		'</div>';
		return str;
	}

/************************************************/
/*                  INCLUDES                    */
/************************************************/

// a few placeholder items to keep things hidden if necessary
	new G.Res({
		name:'unobtainium',
		desc:'@[unobtainium] can never actually be unlocked without cheating//@can be used to hide other things or make them unattainable',
		icon:[3,12,11,8,3,0],
		category:'misc',
	});

// helper function to remove mode from a unit
	G.removeMode=function(unit,mode)
	{
		delete G.getDict(unit).modes[mode];
	}

// helper function to convert existing units from one mode to another
	G.convertUnitMode=function(unit,modeFrom,modeTo)
	{
		var len=G.unitsOwned.length;
		var units=[];
		for (var i=0;i<len;i++)
		{
			if (G.unitsOwned[i].unit.name==unit && G.unitsOwned[i].mode.id==modeFrom)
			{
				G.setUnitMode(G.unitsOwned[i], G.unitsOwned[i].unit.modes[modeTo]);
			}
		}
	}

/************************************************/
/*              BASE GAME TWEAKS                */
/************************************************/

// separate all unit categories into new lines, make more use of the space especially in early game
	G.separateUnitCategories=function(sep)
	{
		G.update['unit'] = eval("("+G.update['unit'].toString().replace('style="display:'+(sep?'inline-':'')+'block;"','style="display:'+(sep?'':'inline-')+'block;"')+")");
		G.update['unit']();
	}

	// callback function to make the change
	G.callbackSeparateUnits=function() {
		G.separateUnitCategories(G.checkHSetting('separateunits')=="on");
	}

	// setting to toggle the separation of the unit categories
	new G.HSetting({
		hcategory:'display',
		name:'separateunits',
		displayName:'Separate Unit Categories',
		desc:'Change the display of unit categories to always appear on separate lines.',
		icon:[0,8,1,12],
		cost:{},
		startsWith:true,
		visible:false,
		binary: true,
		effects:{
			'onChange':{func:G.callbackSeparateUnits}
		},
	});

	// call this once when the mod loads to restore saved state
	G.initializeSeparateUnits=function()
	{
		if (isEmpty(G.update['unit']))
		{
			setTimeout(this,1000);
		} else {
			G.callbackSeparateUnits();
		}
	}
	setTimeout(G.initializeSeparateUnits,500);	// wait to start, since the empty check doesn't seem to work


/************************************************/
/*                 BUGFIXES                     */
/************************************************/

// Tooltip icon fix
// fix corrupted display of third party icon sheets displayed within object tooltips
// the problem was a markup shortcut using "//" which inconveniently clobbered the slashes in "http://" for any external resources
	G.fixTooltipIcons=function()
	{
		G.parse=function(what)
		{
			var str='<div class="par">'+((what
			.replaceAll(']s',',*PLURAL*]'))
			.replace(/\[(.*?)\]/gi,G.parseFunc))
			.replaceAll('http(s?)://','http$1:#SLASH#SLASH#')
			.replaceAll('//','</div><div class="par">')
			.replaceAll('#SLASH#SLASH#','//')
			.replaceAll('@','</div><div class="par bulleted">')
			.replaceAll('<>','</div><div class="divider"></div><div class="par">')+'</div>';
			return str;
		}
	}
	G.initializeFixIcons=function()
	{
		if (G.parse("http://").search("http://") == -1)
		{
			G.fixTooltipIcons();
			setTimeout(G.initializeFixIcons,500);	// check again to make sure this version of the function stays applied during page load
		}
	}
	G.initializeFixIcons();
}
});
