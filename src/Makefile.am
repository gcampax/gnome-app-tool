NULL =

nodist_bin_SCRIPTS = $(PACKAGE_TARNAME)
nodist_pkgdata_SCRIPTS = $(PACKAGE_NAME)

EXTRA_SCRIPTS = org.gnome.AppTool gnome-app-tool

jsdir = $(pkgdatadir)
dist_js_DATA = \
	main.js		\
	package.js	\
	params.js	\
	project.js	\
	util.js		\
	window.js	\
	$(NULL)

$(PACKAGE_TARNAME): $(PACKAGE_TARNAME).in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

$(PACKAGE_NAME): $(PACKAGE_NAME).in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

EXTRA_DIST = $(PACKAGE_NAME).in $(PACKAGE_TARNAME).in
CLEANFILES = $(PACKAGE_NAME) $(PACKAGE_TARNAME)

-include $(top_srcdir)/git.mk
