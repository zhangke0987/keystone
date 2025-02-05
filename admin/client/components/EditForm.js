import React from 'react';
import moment from 'moment';
import Fields from '../fields';
import FormHeading from './FormHeading';
import AltText from './AltText';
import FooterBar from './FooterBar';
import InvalidFieldType from './InvalidFieldType';
import { Button, Col, Form, FormField, FormInput, ResponsiveText, Row } from 'elemental';

var EditForm = React.createClass({
	displayName: 'EditForm',
	getInitialState () {
		return {
			values: Object.assign({}, this.props.data.fields)
		};
	},
	getFieldProps (field) {
		var props = Object.assign({}, field);
		props.value = this.state.values[field.path];
		props.values = this.state.values;
		props.onChange = this.handleChange;
		props.mode = 'edit';
		return props;
	},
	handleChange (event) {
		var values = Object.assign({}, this.state.values);
		values[event.path] = event.value;
		this.setState({
			values: values
		});
	},
	handleReset(ev) {
		if (!confirm(`Are you sure you want to reset your changes to this ${this.props.list.singular.toLowerCase()}?`)) {
			ev && ev.preventDefault();
		}
	},
	handleDelete(ev) {
		if (!confirm(`Are you sure you want to delete this ${this.props.list.singular.toLowerCase()}?`)) {
			ev && ev.preventDefault();
		}
	},
	renderKeyOrId () {
		var className = 'EditForm__key-or-id';
		var list = this.props.list;

		if (list.nameField && list.autokey && this.props.data[list.autokey.path]) {
			return (
				<AltText
					normal={list.autokey.path + ': ' + this.props.data[list.autokey.path]}
					modified={'ID: ' + String(this.props.data.id)}
					component="div"
					title="Press <alt> to reveal the ID"
					className={className} />
			);
		} else if (list.autokey && this.props.data[list.autokey.path]) {
			return (
				<div className={className}>{list.autokey.path}: {this.props.data[list.autokey.path]}</div>
			);
		} else if (list.nameField) {
			return (
				<div className={className}>id: {this.props.data.id}</div>
			);
		}
	},
	renderNameField () {
		var nameField = this.props.list.nameField;
		var nameIsEditable = this.props.list.nameIsEditable;
		var wrapNameField = field => (
			<div className="EditForm__name-field">
				{field}
			</div>
		);
		if (nameIsEditable) {
			var nameFieldProps = this.getFieldProps(nameField);
			nameFieldProps.label = null;
			nameFieldProps.size = 'full';
			nameFieldProps.inputProps = {
				className: 'item-name-field',
				placeholder: nameField.label,
				size: 'lg'
			};
			return wrapNameField(
				React.createElement(Fields[nameField.type], nameFieldProps)
			);
		} else {
			return wrapNameField(
				<h2>{this.props.data.name || '(no name)'}</h2>
			);
		}
	},

	renderFormElements () {
		var headings = 0;

		return this.props.list.uiElements.map((el) => {
			if (el.type === 'heading') {
				headings++;
				el.options.values = this.state.values;
				el.key = 'h-' + headings;
				return React.createElement(FormHeading, el);
			}

			if (el.type === 'field') {
				var field = this.props.list.fields[el.field];
				var props = this.getFieldProps(field);
				if ('function' !== typeof Fields[field.type]) {
					return React.createElement(InvalidFieldType, { type: field.type, path: field.path, key: field.path });
				}
				if (props.dependsOn) {
					props.currentDependencies = {};
					Object.keys(props.dependsOn).forEach(dep =>
						props.currentDependencies[dep] = this.state.values[dep]
					);
				}
				props.key = field.path;
				return React.createElement(Fields[field.type], props);
			}
		}, this);
	},

	renderFooterBar () {
		var buttons = [
			<Button key="save" type="primary" submit>Save</Button>
		];
		buttons.push(
			<Button key="reset" onClick={ev => this.handleReset(ev)} href={'/keystone/' + this.props.list.path + '/' + this.props.data.id} type="link-cancel">
				<ResponsiveText hiddenXS="reset changes" visibleXS="reset" />
			</Button>
		);
		if (!this.props.list.nodelete) {
			buttons.push(
				<Button key="del" onClick={ev => this.handleDelete(ev)} href={'/keystone/' + this.props.list.path + '?delete=' + this.props.data.id + Keystone.csrf.query} type="link-delete" className="u-float-right">
					<ResponsiveText hiddenXS={`delete ${this.props.list.singular.toLowerCase()}`} visibleXS="delete" />
				</Button>
			);
		}
		return (
			<FooterBar className="EditForm__footer">
				{buttons}
			</FooterBar>
		);
	},

	renderTrackingMeta () {
		if (!this.props.list.tracking) return null;

		var elements = [];
		var data = {};

		if (this.props.list.tracking.createdAt) {
			data.createdAt = this.props.data.fields[this.props.list.tracking.createdAt];
			if (data.createdAt) {
				elements.push(
					<FormField key="createdAt" label="Created on">
						<FormInput noedit title={moment(data.createdAt).format('DD/MM/YYYY h:mm:ssa')}>{moment(data.createdAt).format('Do MMM YYYY')}</FormInput>
					</FormField>
				);
			}
		}

		if (this.props.list.tracking.createdBy) {
			data.createdBy = this.props.data.fields[this.props.list.tracking.createdBy];
			if (data.createdBy) {
				// todo: harden logic around user name
				elements.push(
					<FormField key="createdBy" label="Created by">
						<FormInput noedit>{data.createdBy.name.first} {data.createdBy.name.last}</FormInput>
					</FormField>
				);
			}
		}

		if (this.props.list.tracking.updatedAt) {
			data.updatedAt = this.props.data.fields[this.props.list.tracking.updatedAt];
			if (data.updatedAt && (!data.createdAt || data.createdAt !== data.updatedAt)) {
				elements.push(
					<FormField key="updatedAt" label="Updated on">
						<FormInput noedit title={moment(data.updatedAt).format('DD/MM/YYYY h:mm:ssa')}>{moment(data.updatedAt).format('Do MMM YYYY')}</FormInput>
					</FormField>
				);
			}
		}

		if (this.props.list.tracking.updatedBy) {
			data.updatedBy = this.props.data.fields[this.props.list.tracking.updatedBy];
			if (data.updatedBy && (!data.createdBy || data.createdBy.id !== data.updatedBy.id || elements.updatedAt)) {
				elements.push(
					<FormField key="updatedBy" label="Updated by">
						<FormInput noedit>{data.updatedBy.name.first} {data.updatedBy.name.last}</FormInput>
					</FormField>
				);
			}
		}

		return Object.keys(elements).length ? (
			<div className="EditForm__meta">
				<h3 className="form-heading">Meta</h3>
				{elements}
			</div>
		) : null;
	},

	render () {
		return (
			<form method="post" encType="multipart/form-data" className="EditForm-container">
				<Row>
					<Col lg="3/4">
						<Form type="horizontal" className="EditForm" component="div">
							<input type="hidden" name="action" value="updateItem" />
							<input type="hidden" name={Keystone.csrf.key} value={Keystone.csrf.value} />
							{this.renderNameField()}
							{this.renderKeyOrId()}
							{this.renderFormElements()}
							{this.renderTrackingMeta()}
						</Form>
					</Col>
					<Col lg="1/4"><span /></Col>
				</Row>
				{this.renderFooterBar()}
			</form>
		);
	}

});

module.exports = EditForm;
