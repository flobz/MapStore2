/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { connect } = require('react-redux');
const { createSelector } = require('reselect');
const Timeline = require('./timeline/Timeline');
const InlineDateTimeSelector = require('./timeline/InlineDateTimeSelector');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const { currentTimeSelector } = require('../selectors/dimension');
const { offsetEnabledSelector, calculateOffsetTimeSelector } = require('../selectors/timeline');
const { withState, compose } = require('recompose');
const { selectTime, enableOffset, selectOffset } = require('../actions/timeline');
const { selectPlaybackRange } = require('../actions/playback');
const { playbackRangeSelector } = require('../selectors/playback');

const { head } = require('lodash');
const moment = require('moment');

const isValidOffset = (start, end) => moment(end).diff(start) > 0;

/**
  * ZoomIn Plugin. Provides button to zoom in
  * @class  ZoomIn
  * @memberof plugins
  * @static
  *
  * @prop {object} cfg.style CSS to apply to the button
  * @prop {string} cfg.className the class name for the button
  *
  */
const TimelinePlugin = compose(
    connect(
        createSelector(
            currentTimeSelector,
            calculateOffsetTimeSelector,
            offsetEnabledSelector,
            playbackRangeSelector,
            (currentTime, calculateOffsetTime, offsetEnabled, playbackRange) => ({
                currentTime,
                calculateOffsetTime,
                offsetEnabled,
                playbackRange
            })
        ), {
            setCurrentTime: selectTime,
            onOffsetEnabled: enableOffset,
            setOffset: selectOffset,
            setPlaybackRange: selectPlaybackRange
        }),
    withState('options', 'setOptions', {})
)(
    ({
        items,
        options,
        setOptions,
        currentTime,
        setCurrentTime,
        offsetEnabled,
        onOffsetEnabled,
        calculateOffsetTime,
        setOffset,
        playbackRange,
        setPlaybackRange
    }) => {

        const { hideLayersName, collapsed, playbackEnabled } = options;

        const playbackItem = head(items && items.filter(item => item.name === 'playback'));
        const Playback = playbackItem && playbackItem.plugin;

        return (<div
            style={{
                position: "absolute",
                bottom: 65,
                left: 100,
                right: collapsed ? 'auto' : 80,
                background: "transparent"
            }}
            className={`timeline-plugin${hideLayersName ? ' hide-layers-name' : ''}${offsetEnabled ? ' with-time-offset' : ''}`}>

            {offsetEnabled && <InlineDateTimeSelector
                glyph="range-start"
                tooltip="Current time"
                date={currentTime}
                onUpdate={start => isValidOffset(start, calculateOffsetTime) && setCurrentTime(start)}
                className="shadow-soft"
                style={{
                    position: 'absolute',
                    top: -60,
                    left: 2
                }} />}

            <div className="timeline-plugin-toolbar">

                {offsetEnabled ?

                    <InlineDateTimeSelector
                        glyph={'range-end'}
                        tooltip="Offset time"
                        date={calculateOffsetTime}
                        onUpdate={end => isValidOffset(currentTime, end) && setOffset(moment(end).diff(currentTime))} /> :
                    <InlineDateTimeSelector
                        glyph={'time-current'}
                        tooltip="Current time"
                        date={currentTime}
                        onUpdate={start => isValidOffset(start, calculateOffsetTime) && setCurrentTime(start)} />}

                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-md',
                        bsStyle: 'primary'
                    }}
                    buttons={[
                        {
                            glyph: 'list',
                            tooltip: !hideLayersName ? 'Hide layers name' : 'Show layers name',
                            bsStyle: !hideLayersName ? 'success' : 'primary',
                            visible: !collapsed,
                            active: !hideLayersName,
                            onClick: () => setOptions({ ...options, hideLayersName: !hideLayersName })
                        },
                        {
                            glyph: 'time-offset',
                            bsStyle: offsetEnabled ? 'success' : 'primary',
                            active: offsetEnabled,
                            tooltip: offsetEnabled ? 'Disable current time with offset' : 'Enable current time with offset',
                            onClick: () => {
                                onOffsetEnabled(!offsetEnabled);
                                setOptions({ ...options, playbackEnabled: false });
                            }
                        },
                        {
                            glyph: 'playback',
                            tooltip: !playbackEnabled ? 'Enable playback controls' : 'Disable playback controls',
                            bsStyle: playbackEnabled ? 'success' : 'primary',
                            active: playbackEnabled,
                            visible: !!Playback,
                            onClick: () => {
                                onOffsetEnabled(false);
                                setOptions({ ...options, playbackEnabled: !playbackEnabled });
                                setPlaybackRange(playbackRange);
                            }
                        }
                    ]} />
                {playbackEnabled && <Playback {...playbackItem}/>}
                <Toolbar
                    btnGroupProps={{
                        className: 'timeline-plugin-toolbar-right'
                    }}
                    btnDefaultProps={{
                        className: 'square-button-md',
                        bsStyle: 'primary'
                    }}
                    buttons={[
                        {
                            tooltip: collapsed ? 'Expand time slider' : 'Collapse time slider',
                            glyph: collapsed ? 'resize-full' : 'resize-small',
                            onClick: () => setOptions({ ...options, collapsed: !collapsed })
                        }
                    ]} />
            </div>
            {!collapsed &&
                <Timeline
                    offsetEnabled={offsetEnabled}
                    playbackEnabled={playbackEnabled}
                    hideLayersName={hideLayersName} />}
        </div>);
    }
);

const assign = require('object-assign');

module.exports = {
    TimelinePlugin: assign(TimelinePlugin, {
        disablePluginIf: "{state('mapType') === 'cesium'}"
    }),
    reducers: {
        dimension: require('../reducers/dimension'),
        timeline: require('../reducers/timeline')
    },
    epics: require('../epics/timeline')
};