import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { TreeviewItem } from './treeview-item';
import {TreeviewComponent} from './treeview.component';

@Injectable()
export abstract class TreeviewEventParser {
    abstract getSelectedChange(component: TreeviewComponent): any[];
}

@Injectable()
export class DefaultTreeviewEventParser extends TreeviewEventParser {
    getSelectedChange(component: TreeviewComponent): any[] {
        const checkedItems = component.selection.checkedItems;
        if (!_.isNil(checkedItems)) {
            return checkedItems.map(item => item.userId);
        }

        return [];
    }
}

export interface DownlineTreeviewItem {
    item: TreeviewItem;
    parent: DownlineTreeviewItem;
}

@Injectable()
export class DownlineTreeviewEventParser extends TreeviewEventParser {
    getSelectedChange(component: TreeviewComponent): any[] {
        const items = component.items;
        if (!_.isNil(items)) {
            let result: DownlineTreeviewItem[] = [];
            items.forEach(item => {
                const links = this.getLinks(item, null);
                if (!_.isNil(links)) {
                    result = result.concat(links);
                }
            });

            return result;
        }

        return [];
    }

    private getLinks(item: TreeviewItem, parent: DownlineTreeviewItem): DownlineTreeviewItem[] {
        if (!_.isNil(item.children)) {
            const link = {
                item: item,
                parent: parent
            };
            let result: DownlineTreeviewItem[] = [];
            item.children.forEach(child => {
                const links = this.getLinks(child, link);
                if (!_.isNil(links)) {
                    result = result.concat(links);
                }
            });

            return result;
        }

        if (item.checked) {
            return [{
                item: item,
                parent: parent
            }];
        }

        return null;
    }
}

@Injectable()
export class OrderDownlineTreeviewEventParser extends TreeviewEventParser {
    private currentDownlines: DownlineTreeviewItem[] = [];
    private parser = new DownlineTreeviewEventParser();

    getSelectedChange(component: TreeviewComponent): any[] {
        const newDownlines: DownlineTreeviewItem[] = this.parser.getSelectedChange(component);
        if (this.currentDownlines.length === 0) {
            this.currentDownlines = newDownlines;
        } else {
            const intersectDownlines: DownlineTreeviewItem[] = [];
            this.currentDownlines.forEach(downline => {
                let foundIndex = -1;
                const length = newDownlines.length;
                for (let i = 0; i < length; i++) {
                    if (downline.item.userId === newDownlines[i].item.userId) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex !== -1) {
                    intersectDownlines.push(newDownlines[foundIndex]);
                    newDownlines.splice(foundIndex, 1);
                }
            });

            this.currentDownlines = intersectDownlines.concat(newDownlines);
        }

        return this.currentDownlines;
    }
}
