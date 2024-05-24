import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { IconButton, Surface } from 'react-native-paper';
import { themeStyle } from './global-style';
import Modal from './Modal';
import { _ } from '@joplin/lib/locale';

interface Props {
	themeId: number;
	visible: boolean;
	onDismiss: ()=> void;
	containerStyle?: ViewStyle;
	children: React.ReactNode;
}

const useStyles = (themeId: number, containerStyle: ViewStyle) => {
	const windowSize = useWindowDimensions();

	return useMemo(() => {
		const theme = themeStyle(themeId);

		return StyleSheet.create({
			webView: {
				backgroundColor: 'transparent',
				display: 'flex',
			},
			webViewContainer: {
				flexGrow: 1,
				flexShrink: 1,
			},
			closeButtonContainer: {
				flexDirection: 'row',
				justifyContent: 'flex-end',
			},
			dialog: {
				backgroundColor: theme.backgroundColor,
				borderRadius: 12,
				padding: 10,

				height: windowSize.height * 0.9,
				width: windowSize.width * 0.97,
				flexShrink: 1,

				// Center
				marginLeft: 'auto',
				marginRight: 'auto',

				...containerStyle,
			},
			dialogContainer: {
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'center',
				alignItems: 'center',
				flexGrow: 1,
			},
		});
	}, [themeId, windowSize.width, windowSize.height, containerStyle]);
};

const DismissibleDialog: React.FC<Props> = props => {
	const styles = useStyles(props.themeId, props.containerStyle);

	const closeButton = (
		<View style={styles.closeButtonContainer}>
			<IconButton
				icon='close'
				accessibilityLabel={_('Close')}
				onPress={props.onDismiss}
			/>
		</View>
	);

	return (
		<Modal
			visible={props.visible}
			onDismiss={props.onDismiss}
			onRequestClose={props.onDismiss}
			containerStyle={styles.dialogContainer}
			animationType='fade'
			backgroundColor='rgba(0, 0, 0, 0.1)'
			transparent={true}
		>
			<Surface style={styles.dialog} elevation={1}>
				{closeButton}
				{props.children}
			</Surface>
		</Modal>
	);
};

export default DismissibleDialog;
