import BootstrapModal from './base.js';
import tpl_prompt from "./templates/prompt.js";
import { converse } from "@converse/headless/converse-core";

const u = converse.env.utils;


const Confirm = BootstrapModal.extend({
    events: {
        'submit .confirm': 'onConfimation'
    },

    initialize () {
        this.confirmation = u.getResolveablePromise();
        BootstrapModal.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change', this.render)
        this.el.addEventListener('closed.bs.modal', () => this.confirmation.reject(), false);
    },

    toHTML () {
        return tpl_prompt(this.model.toJSON());
    },

    afterRender () {
        if (!this.close_handler_registered) {
            this.el.addEventListener('closed.bs.modal', () => {
                if (!this.confirmation.isResolved) {
                    this.confirmation.reject()
                }
            }, false);
            this.close_handler_registered = true;
        }
    },

    onConfimation (ev) {
        ev.preventDefault();
        const form_data = new FormData(ev.target);
        const fields = (this.model.get('fields') || [])
            .map(field => {
                const value = form_data.get(field.name).trim();
                field.value = value;
                if (field.challenge) {
                    field.challenge_failed = (value !== field.challenge);
                }
                return field;
            });

        if (fields.filter(c => c.challenge_failed).length) {
            this.model.set('fields', fields);
            // Setting an array doesn't trigger a change event
            this.model.trigger('change');
            return;
        }
        this.confirmation.resolve(fields);
        this.modal.hide();
    }
});

export default Confirm;
