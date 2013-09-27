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

pkg.initGettext();
pkg.initFormat();
pkg.initResources();
pkg.require({ 'Gdk': '3.0',
              'Gio': '2.0',
              'GLib': '2.0',
              'GObject': '2.0',
              'Gtk': '3.0' });

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

// Preinit some gjs stuff, before we import the module and start building classes
preinitEnvironment();

const Util = imports.util;
const Window = imports.window;

function preinitEnvironment() {
    GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

    if (!GObject.ParamSpec.boxed) {
        GObject.ParamSpec.boxed = function(name, nick, blurb, flags, type) {
            GObject.ParamSpec._new_internal(name, type, nick, blurb, flags);
        }
    }
}

function initEnvironment() {
    window.getApp = function() {
        return Gio.Application.get_default();
    };

    window.getCurrentWindow = function() {
        return getApp().get_windows()[0];
    };
}

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.Application,

    _init: function() {
        this.parent({ application_id: pkg.name,
                      flags: pkg.appFlags });
        if (this.flags & Gio.ApplicationFlags.IS_SERVICE)
            this.inactivity_timeout = 60000;

        GLib.set_application_name(_("Gnome Application Tool"));
    },

    _onQuit: function() {
        this.get_windows().forEach(function(w) { w.close(); });
    },

    _initAppMenu: function() {
        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/AppTool/app-menu.ui');

        let menu = builder.get_object('app-menu');
        this.set_app_menu(menu);
    },

    vfunc_startup: function() {
        this.parent();

        Util.loadStyleSheet('/org/gnome/AppTool/application.css');

        Util.initActions(this,
                         [{ name: 'quit',
                            activate: this._onQuit }]);
        this._initAppMenu();
    },

    vfunc_activate: function() {
        (new Window.MainWindow({ application: this })).show();
    },

    vfunc_shutdown: function() {
        this.parent();
    }
});

function main(argv) {
    initEnvironment();

    return (new Application()).run(argv);
}
