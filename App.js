Ext.define('TasksApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    _activeFilters: [{
        property: 'State',
        operator: '<',
        value: 'Completed'
    }],
    _filterGrid: function() {
        this.grid.store.clearFilter(true);
        this.grid.store.filter(this._activeFilters);
        this._saveFilters();
    },
    //    _loadLastFilters: function() {
    //        Rally.data.PreferenceManager.load({
    //            filterByUser: true,
    //            appID: this.getContext().get('appID'),
    //            success: function(settings) {
    //                var filters = JSON.parse(settings['task.filters']);
    //                this._activeFilters = filters;
    //                this._filterGrid();
    //                this._setFilterValuesOnComboBoxes();
    //            },
    //            scope: this
    //        });
    //    },
    //    _saveFilters: function() {
    //        var taskFilters = JSON.stringify(this._activeFilters);
    //        Rally.data.PreferenceManager.update({
    //            appID: this.getContext().get('appID'),
    //            filterByUser: true,
    //            settings: {
    //                'task.filters': taskFilters
    //            },
    //            scope: this
    //        });
    //    },
    _loadLastFilters: function() {
        var filters = JSON.parse(this.settings['task.filters']);
        this._activeFilters = filters;
        this._filterGrid();
        this._setFilterValuesOnComboBoxes();
    },
    _saveFilters: function() {
        var taskFilters = JSON.stringify(this._activeFilters);
        this.updateSettingsValues({
            settings: {
                'task.filters': taskFilters
            }
        });
    },
    _setFilterValuesOnComboBoxes: function() {
        var ownerFilter = this._getFilterByProperty("Owner");
        var iterationFilter = this._getFilterByProperty("Iteration");
        var releaseFilter = this._getFilterByProperty("Release");

        if (ownerFilter) {
            Ext.getCmp('ownerComboBox').setValue(ownerFilter.value);
        }
        if (iterationFilter) {
            Ext.getCmp('iterationComboBox').setValue(iterationFilter.value);
        }

        if (releaseFilter) {
            Ext.getCmp('releaseComboBox').setValue(releaseFilter.value);
        }
    },
    _getFilterByProperty: function(property) {
        var matchedFilter = null;
        Ext.Array.forEach(this._activeFilters, function(filter) {
            if (filter.property === property) {
                matchedFilter = filter;
            }
        });

        return matchedFilter;
    },
    _addFilter: function(filter) {
        this._removeFilterByProperty(filter.property);

        //always add new filter
        this._activeFilters.push(filter);
    },
    _removeFilterByProperty: function(property) {
        var existingIndex = -1;
        Ext.Array.forEach(this._activeFilters, function(existingFilter, index) {
            if (existingFilter.property === property) {
                existingIndex = index;
            }
        });

        if (existingIndex !== -1) {
            //remove existing filter
            this._activeFilters.splice(existingIndex, 1);
        }
    },
    _optionSelected: function(propertyName) {
        return function(comboBox, records) {
            var filter = {
                property: propertyName,
                value: records[0].get("_ref")
            };

            this._addFilter(filter);
            this._filterGrid();
        }
    },
    _resetFilters: function() {
        this._activeFilters = [this._activeFilters[0]];
        this._clearFilterInputs();
        this._filterGrid();
    },
    _clearFilterInputs: function() {
        Ext.getCmp('ownerComboBox').reset();
        Ext.getCmp('iterationComboBox').reset();
        Ext.getCmp('releaseComboBox').reset();
    },
    _makeClearButton: function(fieldToClear, filterProperty) {
        return {
            xtype: 'button',
            cls: 'clear-button',
            text: '',
            listeners: {
                click: Ext.bind(function() {
                    Ext.getCmp(fieldToClear).reset();
                    this._removeFilterByProperty(filterProperty);
                    this._filterGrid();
                }, this)
            }
        };
    },
    launch: function launch() {
        window.TEST = this;
        Rally.data.ModelFactory.getModel({
            type: 'Task',
            scope: this,
            success: function(model) {
                var project = Rally.environment.getContext().getProject().ObjectID;

                var me = this;
                var clearFiltersStoreConfig = {
                    listeners: {
                        load: function() {
                            me._clearFilterInputs();
                        }
                    }
                };
                var filterContainer = {
                    width: 1000,
                    xtype: 'container',
                    cls: 'filter-container',
                    layout: {
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'container',
                        items: [{
                            xtype: 'button',
                            text: 'Reset Filters',
                            handler: Ext.bind(this._resetFilters, this)
                        }],
                        flex: 1
                    }, {
                        xtype: 'container',
                        cls: 'owner-container',
                        layout: 'hbox',
                        items: [{
                            id: 'ownerComboBox',
                            labelWidth: 45,
                            clearCls: 'tes-test-test',
                            xtype: 'rallyusercombobox',
                            fieldLabel: 'Owner',
                            project: '/project/' + project,
                            storeConfig: clearFiltersStoreConfig,
                            listeners: {
                                select: Ext.bind(this._optionSelected("Owner"), this)
                            }
                        },
                        this._makeClearButton('ownerComboBox', 'Owner')],
                        flex: 1
                    }, {
                        xtype: 'container',
                        layout: 'hbox',
                        items: [{
                            id: 'releaseComboBox',
                            xtype: 'rallyreleasecombobox',
                            plugins: [],
                            fieldLabel: "Release",
                            autoSelect: false,
                            labelWidth: 45,
                            listConfig: {
                                minWidth: 90,
                                width: 90,
                                itemTpl: new Ext.XTemplate('<div class="timebox-name<tpl if="isSelected"> timebox-item-selected</tpl>">{formattedName}</div>')
                            },
                            storeConfig: clearFiltersStoreConfig,
                            listeners: {
                                select: Ext.bind(this._optionSelected("Release"), this)
                            }
                        },
                        this._makeClearButton('releaseComboBox', 'Release')],
                        flex: 1
                    }, {
                        xtype: 'container',
                        layout: 'hbox',
                        items: [{
                            id: 'iterationComboBox',
                            xtype: 'rallyiterationcombobox',
                            plugins: [],
                            fieldLabel: "Iteration",
                            labelWidth: 45,
                            listConfig: {
                                minWidth: 90,
                                width: 90,
                                itemTpl: new Ext.XTemplate('<div class="timebox-name<tpl if="isSelected"> timebox-item-selected</tpl>">{formattedName}</div>')
                            },
                            storeConfig: clearFiltersStoreConfig,
                            listeners: {
                                select: Ext.bind(this._optionSelected("Iteration"), this)
                            }
                        },
                        this._makeClearButton('iterationComboBox', 'Iteration')],
                        flex: 1
                    }]
                };

                this.add(filterContainer);
                this.grid = this.add({
                    xtype: 'rallygrid',
                    model: model,
                    columnCfgs: ['FormattedID', 'Name', 'WorkProduct', 'Owner', 'Release', 'Iteration',
                    // 'Workspace',
                    'Project'],
                    storeConfig: {
                        context: {
                            projectScopeUp: false,
                            projectScopeDown: true
                        },
                        filters: this._activeFilters
                    }
                });

                var me = this;
                setTimeout(function() {
                    me._loadLastFilters();
                }, 1000);
            }
        });
    },
});
