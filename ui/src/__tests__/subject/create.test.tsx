import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fetchMock from 'jest-fetch-mock'
import { renderWithProviders, mockPermissionUiResponse } from '@/utils/testing'
import SubjectCreatePage from '@/pages/subject/create/index'

const pushSpy = jest.fn()
jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: jest.fn(() => ({
    locale: 'en',
    push: pushSpy
  }))
}))

describe('Page: Subject Create', () => {
  afterEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
  })

  it('renders', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPermissionUiResponse), { status: 200 })
    renderWithProviders(<SubjectCreatePage />)

    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))
    expect(screen.getByTestId('field-type')).toBeInTheDocument()
    expect(screen.queryByTestId('field-email')).not.toBeInTheDocument()
    expect(screen.getByTestId('field-name')).toBeInTheDocument()
    expect(screen.getByTestId('submit')).toBeInTheDocument()
  })

  it('user prompts email field', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockPermissionUiResponse), { status: 200 })
    renderWithProviders(<SubjectCreatePage />)

    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))
    expect(screen.queryByTestId('field-email')).not.toBeInTheDocument()

    userEvent.selectOptions(screen.getByTestId('field-type'), 'User')
    expect(screen.getByTestId('field-email')).toBeInTheDocument()
  })

  describe('on submit', () => {
    it('client  success', async () => {
      const mockData = {
        client_name: 'James Bond',
        client_secret: 'secret-code-word', // pragma: allowlist secret
        client_id: 'id-abc123',
        permissions: ['DATA_ADMIN', 'READ_PRIVATE']
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockPermissionUiResponse), {
        status: 200
      })
      renderWithProviders(<SubjectCreatePage />)
      await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))

      userEvent.selectOptions(screen.getByTestId('field-type'), 'Client')
      await userEvent.type(screen.getByTestId('field-name'), 'James Bond')

      userEvent.selectOptions(screen.getByTestId('select-type'), 'WRITE')
      userEvent.selectOptions(screen.getByTestId('select-layer'), 'ALL')
      userEvent.selectOptions(screen.getByTestId('select-sensitivity'), 'ALL')
      await userEvent.click(screen.getByTestId('AddIcon'))
      await userEvent.click(screen.getByTestId('submit'))

      fetchMock.mockResponseOnce(JSON.stringify(mockData), { status: 200 })

      await waitFor(async () => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/client',
          expect.objectContaining({
            body: '{"permissions":["WRITE_ALL"],"client_name":"James Bond"}'
          })
        )
      })

      await waitFor(async () => {
        expect(pushSpy).toHaveBeenCalledWith({
          pathname: '/subject/create/success/',
          query: {
            Client: 'James Bond',
            Id: mockData.client_id,
            Secret: mockData.client_secret
          }
        })
      })
    })

    it('user success', async () => {
      const mockData = {
        username: 'user-abc',
        user_id: 'id-abc123',
        email: 'test@example.com'
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockPermissionUiResponse), {
        status: 200
      })
      renderWithProviders(<SubjectCreatePage />)
      await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))

      userEvent.selectOptions(screen.getByTestId('field-type'), 'User')
      await userEvent.type(screen.getByTestId('field-name'), 'James Bond')
      await userEvent.type(screen.getByTestId('field-email'), 'test@example.com')

      userEvent.selectOptions(screen.getByTestId('select-type'), 'WRITE')
      userEvent.selectOptions(screen.getByTestId('select-layer'), 'ALL')
      userEvent.selectOptions(screen.getByTestId('select-sensitivity'), 'ALL')
      await userEvent.click(screen.getByTestId('AddIcon'))
      await new Promise((r) => setTimeout(r, 2000))
      await userEvent.click(screen.getByTestId('submit'))
      fetchMock.mockResponseOnce(JSON.stringify(mockData), { status: 200 })

      await waitFor(async () => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/user',
          expect.objectContaining({
            body: '{"permissions":["WRITE_ALL"],"username":"James Bond","email":"test@example.com"}'
          })
        )
      })

      await waitFor(async () => {
        expect(pushSpy).toHaveBeenCalledWith({
          pathname: '/subject/create/success/',
          query: {
            User: mockData.username,
            Id: mockData.user_id,
            Email: mockData.email
          }
        })
      })
    })

    it('server error', async () => {
      const error = 'server error message'
      fetchMock.mockResponseOnce(JSON.stringify(mockPermissionUiResponse), {
        status: 200
      })
      renderWithProviders(<SubjectCreatePage />)
      await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))

      userEvent.selectOptions(screen.getByTestId('field-type'), 'Client')
      await userEvent.type(screen.getByTestId('field-name'), 'James Bond')
      userEvent.selectOptions(screen.getByTestId('select-type'), 'WRITE')
      userEvent.selectOptions(screen.getByTestId('select-layer'), 'ALL')
      userEvent.selectOptions(screen.getByTestId('select-sensitivity'), 'ALL')
      await userEvent.click(screen.getByTestId('AddIcon'))
      await userEvent.click(screen.getByTestId('submit'))

      fetchMock.mockReject(new Error(error))

      await waitFor(async () => {
        expect(screen.getByText(error)).toBeInTheDocument()
      })
    })
  })
})
