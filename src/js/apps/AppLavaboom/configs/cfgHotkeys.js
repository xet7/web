module.exports = /*@ngInject*/(hotkeysProvider) => {
    hotkeysProvider.templateTitle = 'Keyboard shortcuts';
    hotkeysProvider.template =  '<div class="cfp-hotkeys-container fade" ng-class="{in: helpVisible}" style="display: none;"><div class="cfp-hotkeys">' +
                                    '<h4 class="cfp-hotkeys-title">{{ title }}</h4>' +
                                    '<table><tbody>' +
                                        '<tr ng-repeat="hotkey in hotkeys | filter:{ description: \'!$$undefined$$\' }">' +
                                            '<td class="cfp-hotkeys-keys">' +
                                                '<span ng-repeat="key in hotkey.combo track by $index" class="cfp-hotkeys-key">{{ key }}</span>' +
                                            '</td>' +
                                            '<td class="cfp-hotkeys-text">{{ hotkey.description }}</td>' +
                                        '</tr>' +
                                    '</tbody></table>' +
                                    '<div class="cfp-hotkeys-close" ng-click="toggleCheatSheet()">×</div>' +
                                '</div></div>';
    hotkeysProvider.cheatSheetDescription = 'Show/Hide Keyboard Shortcuts';
};