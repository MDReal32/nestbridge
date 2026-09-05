import { WidgetsController } from '../server/widgets.controller';

const widgets = new WidgetsController();

export const findOne = () => widgets.findOne('123', true);
export const search = () => widgets.search('a');
export const create = () => widgets.create({ name: 'MDReal' });
export const byHeader = () => widgets.byHeader('value');
