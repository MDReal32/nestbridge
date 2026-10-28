import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

const DEFAULT_PORT = 3602;

const [authorId = '1', title = 'Notes on the engine'] = process.argv.slice(2);

const posts = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: '127.0.0.1',
    port: Number(process.env.POSTS_PORT ?? DEFAULT_PORT),
  },
});

try {
  const published = await lastValueFrom(posts.send({ cmd: 'posts.publish' }, { authorId, title }));
  process.stdout.write(`${JSON.stringify(published)}\n`);
} catch (error) {
  const reason = error instanceof Error ? error.message : JSON.stringify(error);
  process.stderr.write(`posts rejected the post: ${reason}\n`);
  process.exitCode = 1;
} finally {
  await posts.close();
}
