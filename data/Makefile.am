# I chose to use recursive automake so I can use nobase_ and avoid
# 5 different directory declarations
SUBDIRS = icons

resource_files = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir) --generate-dependencies $(srcdir)/$(PACKAGE_NAME).gresource.xml)
$(PACKAGE_NAME).gresource: $(PACKAGE_NAME).gresource.xml $(resource_files)
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir) $<

resourcedir = $(pkgdatadir)
resource_DATA = $(PACKAGE_NAME).gresource

appsdir = $(datadir)/applications
apps_DATA = $(PACKAGE_NAME).desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = $(PACKAGE_NAME).gschema.xml

@GSETTINGS_RULES@

appdatadir = $(datadir)/appdata
appdata_DATA = $(PACKAGE_NAME).appdata.xml

@INTLTOOL_XML_RULE@

$(PACKAGE_NAME).service: $(PACKAGE_NAME).service.in
	$(AM_V_GEN) sed \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

servicedir = $(datadir)/dbus-1/services
service_DATA = $(PACKAGE_NAME).service

EXTRA_DIST = \
	$(PACKAGE_NAME).desktop.in \
	$(PACKAGE_NAME).service.in \
	$(PACKAGE_NAME).gresource.xml \
	$(PACKAGE_NAME).gschema.xml \
	$(PACKAGE_NAME).appdata.xml.in \
	$(resource_files) \
	$(NULL)

CLEANFILES = \
	$(PACKAGE_NAME).desktop.in \
	$(PACKAGE_NAME).service \
	$(PACKAGE_NAME).gresource \
	$(PACKAGE_NAME).search-provider.ini \
	$(PACKAGE_NAME).gschema.xml \
	$(PACKAGE_NAME).appdata.xml \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)

-include $(top_srcdir)/git.mk
