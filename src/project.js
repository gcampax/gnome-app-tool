// -*- Mode: js; indent-tabs-mode: nil; c-basic-offset: 4; tab-width: 4 -*-
//
// Copyright (c) 2013 Red Hat, Inc.
//
// Gnome App Tools is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by the
// Free Software Foundation; either version 2 of the License, or (at your
// option) any later version.
//
// Gnome App Tools is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
// for more details.
//
// You should have received a copy of the GNU General Public License along
// with Gnome App Tools; if not, write to the Free Software Foundation,
// Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
//
// Author: Giovanni Campagna <scampa.giovanni@gmail.com>

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Params = imports.params;

const Util = imports.util;

const ApplicationModel = new Lang.Class({
    Name: 'ApplicationModel',
    Extends: GObject.Object,
    Properties: {
	'app-name': GObject.ParamSpec.string('app-name', '','', GObject.ParamFlags.READWRITE, ''),
	'comment': GObject.ParamSpec.string('comment', '','', GObject.ParamFlags.READWRITE, ''),
	'keywords': GObject.ParamSpec.boxed('keywords', '', '', GObject.ParamFlags.READWRITE, GObject.type_from_name('GStrv')),
	'appdata-name': GObject.ParamSpec.string('appdata-name', '','', GObject.ParamFlags.READWRITE, ''),
	'appdata-summary': GObject.ParamSpec.string('appdata-summary', '','', GObject.ParamFlags.READWRITE, ''),
	'appdata-url': GObject.ParamSpec.string('appdata-url', '','', GObject.ParamFlags.READWRITE, ''),
    },

    _init: function(basedir, id) {
	this.parent();

	this._basedir = basedir;
	this._pkgId = id;

	this._desktop = new GLib.KeyFile();

	let desktopFN = GLib.build_filenamev([this._basedir, 'data',
					      id + '.desktop.in.in']);
	this._desktopFile = Gio.File.new_for_path(desktopFN);
	if (!this._desktopFile.query_exists(null)) {
	    let desktopFN = GLib.build_desktopFilenamev([this._basedir, 'data',
						  id + '.desktop.in']);
	    this._desktopFile = Gio.File.new_for_path(desktopFN);
	}

	this._desktop.load_from_file(this._desktopFile.get_path(), GLib.KeyFileFlags.NONE);

	let appdataFN = GLib.build_filenamev([this._basedir, 'data',
					      id + '.appdata.xml.in']);
	this._appdataFile = Gio.File.new_for_path(appdataFN);
	let [ok, data] = GLib.file_get_contents(appdataFN);
	data = String(data);
	if (data.startsWith('<?xml'))
	    data = data.replace(/<\?xml[^\n]+/, '');
	this._appdata = new XML(data);

	this._saveTimeoutId = 0;
    },

    get app_name() {
	try {
	    return this._desktop.get_string('Desktop Entry', '_Name');
	} catch(e) {
	    return '';
	}
    },

    set app_name(v) {
	if (v == this.app_name)
	    return;

	this._desktop.set_string('Desktop Entry', '_Name', v);
	this.save();
	this.notify('app-name');
    },

    get comment() {
	try {
	    return this._desktop.get_string('Desktop Entry', '_Comment');
	} catch(e) {
	    return '';
	}
    },

    set comment(v) {
	if (v == this.comment)
	    return;

	this._desktop.set_string('Desktop Entry', '_Comment', v);
	this.save();
	this.notify('comment');
    },

    get keywords() {
	try {
	    return this._desktop.get_string_list('Desktop Entry', '_Keywords');
	} catch(e) {
	    return [];
	}
    },

    set keywords(v) {
	if (Util.arrayEqual(v, this.keywords))
	    return;

	if (v.length > 0)
	    this._desktop.set_string_list('Desktop Entry', '_Keywords', v);
	else
	    this._desktop.remove_key('Desktop Entry', '_Keywords');
	this.save();
	this.notify('keywords');
    },

    get appdata_name() {
	if (this._appdata.application._name)
	    return this._appdata.application._name.text();
	else
	    return '';
    },

    set appdata_name(v) {
	if (v == this.appdata_name)
	    return;

	this._appdata.application._name = v;
	this.save();
	this.notify('appdata-name');
    },

    get appdata_summary() {
	if (this._appdata.application._summary)
	    return this._appdata.application._summary.text();
	else
	    return '';
    },

    set appdata_summary(v) {
	if (v == this.appdata_summary)
	    return;

	this._appdata.application._summary = v;
	this.save();
	this.notify('appdata-summary');
    },

    get appdata_url() {
	log('get url');
	let v = this._appdata.application.url.*.text() || '';
	log(v);
	return v;
    },

    set appdata_url(v) {
	if (v == this.appdata_url)
	    return;

	this._appdata.application.url = v;
	this._appdata.application.url.@type = 'homepage';
	this.save();
	this.notify('appdata-url');
    },    

    save: function() {
	if (this._saveTimeoutId != 0)
	    return;

	this._saveTimeoutId = Mainloop.timeout_add_seconds(20, Lang.bind(this, this._saveTimeout));
    },

    saveNow: function() {
	if (this._saveTimeoutId == 0)
	    return true;

	Mainloop.source_remove(this._saveTimeoutId);
	this._saveTimeoutId = 0;

	let [desktopData, len] = this._desktop.to_data();
	let appdataData = this._appdata.toString();
	try {
	    this._desktopFile.replace_contents(desktopData, null, true, Gio.FileCreateFlags.NONE, null);
	    this._appdataFile.replace_contents(appdataData, null, true, Gio.FileCreateFlags.NONE, null);
	    return true;
	} catch(e) {
	    getCurrentWindow().notifyError(_("Failed to save: %s").format(e.message));
	    return false;
	}
    },

    _saveTimeout: function(sync) {
	let [data, len] = this._desktop.to_data();

	this._desktopFile.replace_contents_async(data, null, true, Gio.FileCreateFlags.NONE,
				    null, Lang.bind(this, this._onDesktopSaved));
	this._saveTimeoutId = 0;
	return false;
    },

    _onDesktopSaved: function(source, result) {
	try {
	    source.replace_contents_finish(result);

	    appdataData = this._appdata.toString();
	    this._appdataFile.replace_contents_async(appdataData, null, true, Gio.FileCreateFlags.NONE,
						     null, Lang.bind(this, this._onAppdataSaved));
	} catch(e) {
	    getCurrentWindow().notifyError(_("Failed to save: %s").format(e.message));
	}
    },

    _onAppdataSaved: function(source, result) {
	try {
	    source.replace_contents_finish(result);
	} catch(e) {
	    getCurrentWindow().notifyError(_("Failed to save: %s").format(e.message));
	}
    }
});

const ProjectView = new Lang.Class({
    Name: 'ProjectView',
    Extends: Gio.SimpleActionGroup,

    _init: function(ui) {
	this.parent();

	this._ui = ui;
	this.widget = ui.get_object('project-grid');

	this._info = ui.get_object('project-info');
	this._infoRevealer = ui.get_object('project-info-revealer');
	this._infoMessage = ui.get_object('project-info-message');
	ui.get_object('project-info').connect('response', Lang.bind(this, function(infobar, id) {
	    if (id == Gtk.ResponseType.CLOSE)
		this._infoRevealer.reveal_child = false;

	    if (this._quitOnInfoClose)
		this.widget.get_toplevel().destroy();
	}));
	this._quitOnInfoClose = false;

	let stack = ui.get_object('project-stack');
        stack.add_titled(ui.get_object('page-desktop'),
                         'desktop', _("Desktop file"));
	stack.add_titled(ui.get_object('page-appdata'),
			 'appdata', _("Appdata file"));

	this.switcher = new Gtk.StackSwitcher({ stack: stack });

	this._bindings = {};

	Util.initActions(this,
			 [{ name: 'keyword-add',
			    activate: this._keywordAdd },
			  { name: 'keyword-remove',
			    activate: this._keywordRemove }]);
	this.widget.insert_action_group('page', this);

	let keywordList = ui.get_object('keyword-store');
	keywordList.connect('row-inserted', Lang.bind(this, this._queueSaveKeywords));
	keywordList.connect('row-deleted', Lang.bind(this, this._queueSaveKeywords));
	keywordList.connect('row-changed', Lang.bind(this, this._queueSaveKeywords));

	let renderer = ui.get_object('keyword-cell');
        renderer.connect('edited', Lang.bind(this, this._keywordEdit));

	ui.get_object('chk-appdata-name').connect('notify::active', Lang.bind(this, this._syncAppdataBindings));
	ui.get_object('chk-appdata-summary').connect('notify::active', Lang.bind(this, this._syncAppdataBindings));

	ui.get_object('chk-appdata-name').bind_property('active', ui.get_object('entry-appdata-name'), 'sensitive',
							GObject.BindingFlags.SYNC_CREATE);
	ui.get_object('chk-appdata-summary').bind_property('active', ui.get_object('entry-appdata-summary'), 'sensitive',
							GObject.BindingFlags.SYNC_CREATE);
    },

    _bindModel: function(model, property, widgetName) {
	let widget = this._ui.get_object(widgetName);
	let flags = GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL;
	this._bindings[property] = model.bind_property(property, widget, 'text', flags);
    },

    _bindRecursive: function(model, property, otherProperty) {
	let flags = GObject.BindingFlags.SYNC_CREATE;
	this._bindings[property] = model.bind_property(otherProperty, model, property, flags);
    },

    _syncAppdataBindings: function() {
	if (!this._model)
	    return;

	if (this._bindings['appdata-name'])
	    this._bindings['appdata-name'].unbind();
	if (this._ui.get_object('chk-appdata-name').active)
	    this._bindModel(this._model, 'appdata-name', 'entry-appdata-name');
	else
	    this._bindRecursive(this._model, 'appdata-name', 'app-name');

	if (this._bindings['appdata-summary'])
	    this._bindings['appdata-summary'].unbind();
	if (this._ui.get_object('chk-appdata-summary').active)
	    this._bindModel(this._model, 'appdata-summary', 'entry-appdata-summary');
	else
	    this._bindRecursive(this._model, 'appdata-summary', 'comment');
    },

    setModel: function(model) {
	this._model = model;

	for (let b in this._bindings)
	    this._bindings[b].unbind();
	this._bindings = {};

	if (model == null)
	    return;

	this._bindModel(model, 'app-name', 'entry-name');
	this._bindModel(model, 'comment', 'entry-comment');
	this._syncAppdataBindings();
	this._bindModel(model, 'appdata-url', 'entry-appdata-url');

	let keywordList = this._ui.get_object('keyword-store');
	keywordList.clear();

	let keywords = model.keywords;
	for (let i = 0; i < keywords.length; i++)
	    keywordList.insert_with_valuesv(-1, [0], [keywords[i]]);
    },

    updateHeader: function(header, ui) {
	header.custom_title = this.switcher;
	this._ui.get_object('btn-goto-project-selection').show();
    },

    notifyError: function(msg) {
	this._info.message_type = Gtk.MessageType.ERROR;
	this._infoRevealer.reveal_child = true;
	this._infoMessage.label = msg;
    },

    save: function() {
	if (!this._model || this._quitOnInfoClose)
	    return true;

	if (!this._model.saveNow()) {
	    this.setModel(null);
	    this._quitOnInfoClose = true;
	    return false;
	}

	return true;
    },

    _saveKeywords: function() {
	let gtkModel = this._ui.get_object('keyword-store');

	let keywords = [];
	let [ok, iter] = gtkModel.get_iter_first();
	while (ok) {
	    let v = gtkModel.get_value(iter, 0);
	    keywords.push(v);

	    ok = gtkModel.iter_next(iter);
	}

	if (this._model)
	    this._model.keywords = keywords;

	this._saveKeywordsId = 0;
	return false;
    },

    _queueSaveKeywords: function() {
	if (this._saveKeywordsId)
	    return;

	this._saveKeywordsId = Mainloop.idle_add(Lang.bind(this, this._saveKeywords));
    },

    _keywordEdit: function(renderer, path, new_text) {
	let gtkModel = this._ui.get_object('keyword-store');

        let [ok, iter] = gtkModel.get_iter_from_string(path);

        if (ok)
            gtkModel.set(iter, [0], [new_text]);
    },

    _keywordAdd: function() {
	let gtkModel = this._ui.get_object('keyword-store');

	gtkModel.insert_with_valuesv(-1, [0], [_("Type here the new keyword").italics()]);
    },

    _keywordRemove: function() {
	let selection = this._ui.get_object('keyword-treeview-selection');

	let [any, gtkModel, selected] = selection.get_selected();
	if (any) {
	    gtkModel.remove(selected);

	    this._queueSaveKeywords();
	}
    },
});
