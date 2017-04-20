GM.AddData({
name:'Heritage mod',
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
 *            HERITAGE SETTINGS              *
 ************************************************
 *
 * Use hidden in-game policies as 'settings' for this mod.
 * We could use actual settings, but the main codebase says mods should not do that (no explanation as to why not -- it works fine -- but hey).
 * Also, settings are not part of the "checkReq" list, only policies, traits, techs, and units, so we want to do it this way anyway.
 *
 */	

 // For starters, basically wraps/mimics the default policy definition with a few additions
	G.hSetting=[];
	G.hSettingByName=[];
	G.hSettingCategories=[];
	
	G.HSetting=function(obj)
	{
		this.type='policy';	// required to work with G.checkReq()
		this.category='debug';
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
			if (G.getSetting('animations')) triggerAnim(me.l,'plop');
			if (me.binary)
			{
				if (mode.id=='off') me.l.classList.add('off');
				else me.l.classList.remove('off');
			}

			// function callback specifically for HSettings
			if (me.effects.onChange) me.effects.onChange.func();
		}
	}

	G.writeHeritageSettingButton=function(obj)
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

				div.onclick=function(div,name,value,siblings){return function(){G.clickHeritageSettingButton(div,name,value,siblings);}}(div,obj.name,obj.value,obj.siblings);
				if (obj.tooltip) G.addTooltip(div,function(str){return function(){return str;};}(obj.tooltip),{offY:-8});
			}
		}}(obj));
		return '<div class="button" id="hsettingButton-'+obj.id+'"></div>';
	}

	G.clickHeritageSettingButton=function(div,name,value,siblings)
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

//		if (me.effects.onChange) me.effects.onChange.func();	// covered by setHSettingMode now

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
		'<b>Heritage</b> is a modpack for NeverEnding Legacy by <a href="http://geekahedron.com/" target="_blank">geekahedron</a>.'+
		'It is currently in early alpha, may feature strange and exotic bugs, and may be updated at any time.</div>'+
		'<div class="par">While in development, the modpack may be unstable and subject to changes, but the overall goal is to '+
		'expand and improve the legacy with flexible, balanced, user-created content and improvements to existing mechanics.</div>'+

		'<div class="fancyText title">Heritage Modpack</div>'+

		// add buttons for mod-specific settings
		'<div class="barred fancyText">Modpack options</div>'+
		G.writeHeritageSettingButton({
				id:'enablecremation',
				name:'enablecremation',
				text:'Enable Cremation technology',
				tooltip:'Turn on the ability for your society to discover cremation technology.'
			})+
		'<br /><br />'+

		// add buttons for hidden base game settings
		'<div class="barred fancyText">Expanded options</div>'+
		G.writeSettingButton({
				id:'tiereddisplay',
				name:'tieredDisplay',
				text:'Enable research tiers',
				tooltip:'Turn on display of available research, arranged in tiers by cost.'
			})+

		'<div class="divider"></div>'+
		'<div class="buttonBox">'+
		G.dialogue.getCloseButton()+
		'</div>';
		return str;
	}

}
});
