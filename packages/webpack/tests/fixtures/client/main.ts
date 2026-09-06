import { UsersResolver } from '../server/user.resolver';
import { WidgetsController } from '../server/widgets.controller';

const widgets = new WidgetsController();
const users = new UsersResolver();

export const findOne = () => widgets.findOne('123', true);
export const search = () => widgets.search('a');
export const create = () => widgets.create({ name: 'MDReal' });
export const byHeader = () => widgets.byHeader('value');
export const findUser = () => users.findOne('1');
