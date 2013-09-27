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
                            activate: this._about }]);

        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/AppTool/main.ui');

        let stack = builder.get_object('main-stack');
        this.add(stack);

        let switcher = new Gtk.StackSwitcher({ stack: stack });
        let header = builder.get_object('main-header');
        header.custom_title = switcher;
        this.set_titlebar(header);
    },

    _about: function() {
        let aboutDialog = new Gtk.AboutDialog(
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

        aboutDialog.show();
        aboutDialog.connect('response', function() {
            aboutDialog.destroy();
        });
    },
});
