//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

import {WorkPackageCacheService} from "../../work-packages/work-package-cache.service";
import {PathHelperService} from 'core-components/common/path-helper/path-helper.service';
import {OpUnlinkTableAction} from 'core-components/wp-table/table-actions/actions/unlink-table-action';
import {WorkPackageRelationsHierarchyService} from 'core-components/wp-relations/wp-relations-hierarchy/wp-relations-hierarchy.service';
import {Component, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WorkPackageEmbeddedTableComponent} from 'core-components/wp-table/embedded/wp-embedded-table.component';
import {componentDestroyed} from 'ng2-rx-componentdestroyed';
import {I18nToken} from 'core-app/angular4-transition-utils';
import {take} from 'rxjs/operators';
import {WorkPackageResource} from 'core-app/modules/hal/resources/work-package-resource';

@Component({
  selector: 'wp-relations-hierarchy',
  template: require('!!raw-loader!./wp-relations-hierarchy.template.html')
})
export class WorkPackageRelationsHierarchyComponent implements OnInit, OnDestroy {
  @Input() public workPackage:WorkPackageResource;
  @Input() public relationType:string;
  @ViewChild('childrenEmbeddedTable') private childrenEmbeddedTable:WorkPackageEmbeddedTableComponent;

  public showEditForm:boolean = false;
  public workPackagePath:string;
  public canHaveChildren:boolean;
  public canModifyHierarchy:boolean;
  public canAddRelation:boolean;

  public childrenQueryProps:any;

  public childrenTableActions = [
    OpUnlinkTableAction.factoryFor(
      'remove-child-action',
      this.I18n.t('js.relation_buttons.remove_child'),
      (child:WorkPackageResource) => {
        this.childrenEmbeddedTable.loadingIndicator = this.wpRelationsHierarchyService
          .removeChild(child)
          .then(() => this.refreshTable());
      })
  ];

  constructor(protected wpRelationsHierarchyService:WorkPackageRelationsHierarchyService,
              protected wpCacheService:WorkPackageCacheService,
              protected PathHelper:PathHelperService,
              @Inject(I18nToken) protected I18n:op.I18n) {
  }

  public text = {
    parentHeadline: this.I18n.t('js.relations_hierarchy.parent_headline'),
    childrenHeadline: this.I18n.t('js.relations_hierarchy.children_headline')
  };

  ngOnInit() {
    this.workPackagePath = this.PathHelper.workPackagePath(this.workPackage.id);
    this.canHaveChildren = !this.workPackage.isMilestone;
    this.canModifyHierarchy = !!this.workPackage.changeParent;
    this.canAddRelation = !!this.workPackage.addRelation;

    this.childrenQueryProps = {
      filters: JSON.stringify([{parent: {operator: '=', values: [this.workPackage.id]}}]),
      'columns[]': ['id', 'type', 'subject'],
      showHierarchies: false
    };

    this.wpCacheService.loadWorkPackage(this.workPackage.id).values$()
      .takeUntil(componentDestroyed(this))
      .subscribe((wp:WorkPackageResource) => {
        this.workPackage = wp;

        let toLoad:string[] = [];

        if (this.workPackage.parent) {
          toLoad.push(this.workPackage.parent.id);

          this.wpCacheService.loadWorkPackage(this.workPackage.parent.id).values$()
            .pipe(
              take(1)
            )
            .subscribe((parent:WorkPackageResource) => {
              this.workPackage.parent = parent;
            });
        }

        if (this.workPackage.children) {
          toLoad.push(...this.workPackage.children.map(child => child.id));
        }

        this.wpCacheService.requireAll(toLoad);
      });
  }

  ngOnDestroy() {
    // Nothing to do
  }

  public refreshTable() {
    this.childrenEmbeddedTable.refresh();
  }
}
