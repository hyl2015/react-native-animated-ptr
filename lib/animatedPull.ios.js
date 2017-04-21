import React from 'react'
import {
    Animated,
    StyleSheet,
    View
} from 'react-native'
import TimedAnimation from '../animations/TimedAnimation'
import ScrollAnimation from '../animations/ScrollAnimation'
import FadeAnimation from '../animations/FadeAnimation'

class AnimatedPTR extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            shouldTriggerRefresh: false,
            scrollY: new Animated.Value(0),
            isScrollFree: true,
            isRefreshing: false
        }
        this.loadCount = 0
        this.contentChange = 0
    }
    
    static propTypes = {
        loadDone: React.PropTypes.bool,
        
        /**
         * Sets pull distance for how far the Y axis needs to be pulled before a refresh event is triggered
         * @type {Integer}
         */
        minPullDistance: React.PropTypes.number,
        onEndReachedThreshold: React.PropTypes.number,
        /**
         * Callback for when the refreshing state occurs
         * @type {Function}
         */
        onRefresh: React.PropTypes.func.isRequired,
        /**
         * The content view which should be passed in as a scrollable type (i.e ScrollView or ListView)
         * @type {Object}
         */
        contentComponent: React.PropTypes.object.isRequired,
        /**
         * The content view's background color, not to be mistaken with the content component's background color
         * @type {string}
         */
        contentBackgroundColor: React.PropTypes.string,
        /**
         * The pull to refresh background color.
         * @type {string}
         */
        PTRbackgroundColor: React.PropTypes.string,
        /**
         * Custom onScroll event
         * @type {Function}
         */
        onScroll: React.PropTypes.func,
        onLoad: React.PropTypes.func
    }
    
    static defaultProps = {
        minPullDistance: 120,
        onEndReachedThreshold: 0.1,
        PTRbackgroundColor: 'white',
        contentBackgroundColor: 'white'
    }
    
    componentDidMount() {
        this.state.scrollY.addListener((value) => this.onScrollTrigger(value))
    }
    
    componentWillUnmount() {
        this.state.scrollY.removeAllListeners()
    }
    
    _onEndReached(info) {
        if (this.props.onLoad && !this.props.loadDone && (this.loadCount === 0 || this.loadCount === this.contentChange - 1)) {
            console.log('_onEndReached..')
            this.loadCount++//计算加载次数
            this.setState({isScrollFree: false})
            this.props.onLoad(() => {
                this.setState({isScrollFree: true})
            })
        }
    }
    
    _onContentSizeChange() {
        this.contentChange++
    }
    
    onScrollTrigger(distance) {
        if (distance.value <= -this.props.minPullDistance) {
            if (!this.state.shouldTriggerRefresh) {
                return this.setState({shouldTriggerRefresh: true})
            }
        } else if (this.state.shouldTriggerRefresh) {
            return this.setState({shouldTriggerRefresh: false})
        }
    }
    
    onScrollRelease() {
        if (!this.state.isRefreshing && this.state.shouldTriggerRefresh) {
            this.loadCount = 0
            this.contentChange = 0
            this.refs.PTR_ScrollComponent.scrollToOffset({offset: -this.props.minPullDistance})
            this.setState({isScrollFree: false, isRefreshing: true})
            this.props.onRefresh(() => {
                this.refs.PTR_ScrollComponent.scrollToOffset({offset: 0})
                this.setState({isScrollFree: true, isRefreshing: false})
            })
        }
    }
    
    render() {
        const onScroll = this.props.onScroll
        let onScrollEvent = (event) => {
            if (onScroll) {
                onScroll(event)
            }
            this.state.scrollY.setValue(event.nativeEvent.contentOffset.y)
        }
        let animateHeight = this.state.scrollY.interpolate({
            inputRange: [-this.props.minPullDistance, 0],
            outputRange: [this.props.minPullDistance, 0]
        })
        
        return (
            <View style={{flex: 1, zIndex: -100, backgroundColor: this.props.contentBackgroundColor}}>
                <Animated.View
                    style={{height: animateHeight, backgroundColor: this.props.PTRbackgroundColor, overflow: 'hidden'}}>
                    {React.Children.map(this.props.children, (child) => {
                        return React.cloneElement(child, {
                            isRefreshing: this.state.isRefreshing,
                            scrollY: this.state.scrollY,
                            minPullDistance: this.props.minPullDistance
                        })
                    })}
                </Animated.View>
                <View style={styles.contentView}>
                    {React.cloneElement(this.props.contentComponent, {
                        scrollEnabled: this.state.isScrollFree,
                        onContentSizeChange: this._onContentSizeChange.bind(this),
                        onScroll: onScrollEvent,
                        scrollEventThrottle: 16,
                        onResponderRelease: this.onScrollRelease.bind(this),
                        ref: 'PTR_ScrollComponent',
                        onEndReached: this._onEndReached.bind(this),
                        onEndReachedThreshold: this.props.onEndReachedThreshold
                    })}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    contentView: {
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
})

AnimatedPTR.TimedAnimation = TimedAnimation
AnimatedPTR.ScrollAnimation = ScrollAnimation
AnimatedPTR.FadeAnimation = FadeAnimation

module.exports = AnimatedPTR
