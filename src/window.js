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

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Params = imports.params;

const Util = imports.util;
const Project = imports.project;

const MainWindow = new Lang.Class({
    Name: 'MainWindow',
    Extends: Gtk.ApplicationWindow,

    _init: function(params) {
        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_width: 640,
                                       default_height: 480 });
        this.parent(params);

        this._searchActive = false;

        Util.initActions(this,
                         [{ name: 'about',
                            activate: this._about },
                          { name: 'goto-project-selection',
                            activate: this._gotoProjectSelection }]);

        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/AppTool/main.ui');

        this._stack = builder.get_object('main-stack');
        this.add(this._stack);

        this._view = {};
        this._view['project-selection'] = undefined; // FIXME
        this._view['project'] = new Project.ProjectView(builder);

        this.header = builder.get_object('main-header');
        this.set_titlebar(this.header);

        this._stack.visible_child_name = 'project';
        this._stack.connect('notify::visible-child', Lang.bind(this, this._updateView));
        this._updateView();

        // FIXME:
        let model = new Project.ApplicationModel(GLib.get_home_dir() + '/gnome/gtk-js-app',
                                                 'com.example.Gtk.JSApplication');
        this._view['project'].setModel(model);
    },

    vfunc_delete_event: function(event) {
        if (this._stack.visible_child_name == 'project')
            this.currentView.save();

        return false;
    },

    get currentView() {
        return this._view[this._stack.visible_child_name];
    },

    notifyError: function(msg) {
        this.currentView.notifyError(msg);
    },

    _updateView: function() {
        if (this.currentView)
            this.currentView.updateHeader(this.header);
    },

    _gotoProjectSelection: function() {
        this._stack.visible_child_name = 'project-selection';
    },

    _about: function() {
        let about = new Gtk.AboutDialog(
            { authors: [ 'Giovanni Campagna <scampa.giovanni@gmail.com>' ],
              translator_credits: _("translator-credits"),
              program_name: _("Gnome Application Tool"),
              comments: _("A tool for editing Gtk+ application metadata"),
              copyright: 'Copyright 2013 The Gnome Application Tool developers',
              license_type: Gtk.License.GPL_2_0,
              logo_icon_name: pkg.name,
              version: pkg.version,
              website: 'http://live.gnome.org/GiovanniCampagna/Experiments/ApplicationTools',
              wrap_license: true,
              modal: true,
              transient_for: this
            });

        about.show();
        about.connect('response', function() {
            about.destroy();
        });
    },
});
